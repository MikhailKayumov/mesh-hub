# ITER-3 — Model Editor: Lights, Display Config & Post-Processing

## Goal

Each 3D model stores its own display configuration: lighting rig, HDRI, background, fog, and post-processing pass settings. The public viewer and embed viewer apply this config on load.

## Status: 🔲 Pending

---

## Backend Changes

### 1. DB Migration

New table: `model_3d.model_display_config`

```sql
CREATE TABLE model_3d.model_display_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL UNIQUE REFERENCES model_3d.model_3d(id) ON DELETE CASCADE,
  background_color varchar(9) NOT NULL DEFAULT '#000000',
  ambient_intensity float8 NOT NULL DEFAULT 0.5,
  environment_hdri_path text,
  fog_enabled boolean NOT NULL DEFAULT false,
  fog_type varchar(10) NOT NULL DEFAULT 'linear',
  fog_color varchar(9) NOT NULL DEFAULT '#cccccc',
  fog_near float8 NOT NULL DEFAULT 10,
  fog_far float8 NOT NULL DEFAULT 100,
  post_process jsonb,
  renderer_config jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
```

`renderer_config` JSONB shape (mirrors `RendererTab` settings already used in the editor):

```json
{
  "colorSpace": "srgb",
  "toneMapping": 4,
  "shadowMapType": 1,
  "pixelRatio": 1,
  "shadowBias": -0.0001
}
```

> **Why:** `RendererTab` currently manages these settings in-session only (lost on refresh). Persisting them in `renderer_config` makes the public viewer and embed viewer reproduce the author's exact display settings.

New table: `model_3d.model_light`

```sql
CREATE TABLE model_3d.model_light (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES model_3d.model_3d(id) ON DELETE CASCADE,
  type varchar(15) NOT NULL,
  pos_x float8 NOT NULL DEFAULT 0,
  pos_y float8 NOT NULL DEFAULT 5,
  pos_z float8 NOT NULL DEFAULT 5,
  color varchar(9) NOT NULL DEFAULT '#ffffff',
  intensity float8 NOT NULL DEFAULT 1.0,
  cast_shadow boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

`post_process` JSONB shape:

```json
{
  "ssao": { "enabled": false, "radius": 16, "intensity": 0.5 },
  "bloom": { "enabled": false, "threshold": 0.9, "strength": 0.3, "radius": 0.5 },
  "dof": { "enabled": false, "focus": 10, "aperture": 0.0025, "maxblur": 0.01 },
  "vignette": { "enabled": false, "offset": 0.5, "darkness": 0.5 },
  "colorCorrection": { "enabled": false, "exposure": 1.0, "contrast": 1.0, "saturation": 1.0 }
}
```

### 2. New submodule — `model-display-config`

`server/src/modules/models-3d/display-config/`

- `ModelDisplayConfigEntity` + entity registration
- `DisplayConfigResponseDto`, `DisplayConfigUpdateDto`, `ModelLightUpsertDto`
- `DisplayConfigService`:
  - `getOrCreate(modelId, user)` — lazy init on first GET
  - `update(modelId, user, dto)` — PATCH config fields
  - `addLight(modelId, user, dto)` / `updateLight` / `removeLight`
  - `uploadHdri(modelId, user, file)` — reuse FilesService
- `DisplayConfigController`:
  - `GET /models-3d/:id/display-config`
  - `PATCH /models-3d/:id/display-config`
  - `POST /models-3d/:id/display-config/hdri`
  - `DELETE /models-3d/:id/display-config/hdri`
  - `POST /models-3d/:id/display-config/lights`
  - `PATCH /models-3d/:id/display-config/lights/:lightId`
  - `DELETE /models-3d/:id/display-config/lights/:lightId`

---

## Frontend — Three.js

### 3. `Renderer.ts` — EffectComposer Pipeline

Replace raw `renderer.render()` with `EffectComposer` pipeline:

```
RenderPass
  → SSAOPass (disabled by default)
  → UnrealBloomPass (disabled by default)
  → BokehPass (disabled by default)
  → ShaderPass(VignetteShader) (disabled by default)
  → ShaderPass(ColorCorrectionShader) (disabled by default)
  → OutputPass
```

New method: `renderer.setPostProcessing(config: PostProcessConfig): void`
- Enables/disables each pass and sets parameters
- `EffectComposer.render()` replaces `renderer.render()`
- Resize: `composer.setSize(width, height)` in `setSize()`

### 4. `World.ts` — Fog support

- `world.setFog(config: FogConfig): void`
  - Linear: `scene.fog = new THREE.Fog(color, near, far)`
  - Exp2: `scene.fog = new THREE.FogExp2(color, density)`
  - Off: `scene.fog = null`

### 5. Display Presets (client constants)

File: `client/src/widgets/Model3DViewer/constants/displayPresets.ts`

```ts
export const DISPLAY_PRESETS = {
  neutral:   { toneMapping: ReinhardToneMapping, exposure: 1.0, postProcess: {...off} },
  eevee:     { toneMapping: ACESFilmicToneMapping, exposure: 1.0, bloom: {...}, ssao: {...} },
  unreal:    { toneMapping: ACESFilmicToneMapping, exposure: 1.2, bloom: {...stronger}, ssao: {...} },
  unityHdrp: { toneMapping: ACESFilmicToneMapping, exposure: 1.0, bloom: {...}, ssao: {...} },
  product:   { toneMapping: LinearToneMapping,   exposure: 1.0, ssao: {...subtle} },
  studio:    { toneMapping: LinearToneMapping,   exposure: 1.0, postProcess: {...off} },
}
```

---

## Frontend — Model Editor

### 6. Lights tab (replace placeholder)

File: `client/src/pages/Editor/panels/tabs/LightsTab.tsx` (replace `<Text>Lights</Text>`)

- Query: `useDisplayConfigQuery(modelId)`
- Reuse shared `LightsPanel` widget (extract common component after ITER-2; same design as `SceneLightsPanel`): color dot + type icon + intensity badge per light; inline add/edit form
- `ColorInput` for light color picker
- **Loading state:** `LoadingOverlay` on the tab while mutation is in-flight
- Save/delete use `useAddModelLightMutation` / `useUpdateModelLightMutation` / `useRemoveModelLightMutation`
- **Delete confirmation:** `modals.openConfirmModal()` before removing a light

### 7. New `DisplayConfigTab`

File: `client/src/pages/Editor/panels/tabs/DisplayConfigTab.tsx`

Sections (use `Divider label="..."` between each):

**Environment:**
- `ColorInput` (Mantine) for background color
- Ambient intensity: `NumberInputSlider` widget (already exists at `widgets/NumberInputSlider/`)
- HDRI upload: `Dropzone` from `@mantine/dropzone` (`.hdr` only, max 20 MB)
- HDRI status: `Badge` with filename + `ActionIcon IconX` remove button; `LoadingOverlay` while uploading

**Fog:**
- `Switch` to enable; `Collapse` reveals type `Select` + `ColorInput` + near/far `NumberInput`s

**Post-Processing:**
- Use `Accordion` from Mantine — one item per effect group:
  - SSAO, Bloom, DOF, Vignette, Color Correction
- Each accordion item header: effect name + `Switch` (enabled/disabled) inline
- Expanded content: effect parameters using `NumberInputSlider` for all float values
- Parameters update live via `renderer.setPostProcessing(config)` (debounced 200ms)

**Renderer:**
- Tone Mapping `Select` (Reinhard / ACESFilmic / Linear / Neutral)
- Settings auto-saved to `renderer_config` on change (debounced 500ms)

**Presets:**
- `SimpleGrid cols={{ base: 1, sm: 2 }}` of `Button variant="outline"` preset cards
- Each card: preset name (`fw={600}`) + `Text size="xs" c="dimmed"` description
- Clicking applies all settings via `renderer.setSettings()` + `renderer.setPostProcessing()`; saves to DB

### 8. RTK Query — display config endpoints

File: `client/src/app/api/display-config.ts` (new, injected into Api)

- `useDisplayConfigQuery(modelId)`
- `useUpdateDisplayConfigMutation()`
- `useAddModelLightMutation()` / `useUpdateModelLightMutation()` / `useRemoveModelLightMutation()`
- `useUploadModelHdriMutation()`

### 9. Viewer applies display config on model load

File: `client/src/widgets/Model3DViewer/hooks/useViewer.ts` or `Viewer.ts`

After model loads, if display config exists:
- `world.applyLights(config.lights)`
- `world.loadHdri(config.hdriPath)` if set
- `world.setAmbientLight(config.ambientIntensity)`
- `renderer.setSettings({ clearColor: config.backgroundColor, ...config.rendererConfig })` — applies persisted renderer settings
- `world.setFog(config.fog)` if enabled
- `renderer.setPostProcessing(config.postProcess)`

This applies in the public viewer, model editor, and embed viewer.

---

## Acceptance Criteria

- [ ] Model Editor has functional Lights tab (add/edit/delete lights with confirm on delete)
- [ ] New Display Config tab with Environment / Fog / Post-Processing / Renderer / Presets sections
- [ ] Post-Processing uses `Accordion` — each effect has inline enable `Switch` + parameters
- [ ] `NumberInputSlider` widget used for all float sliders
- [ ] `ColorInput` used for all color fields (background, light, fog)
- [ ] HDRI upload uses `Dropzone`, shows filename badge + remove button, loading overlay during upload
- [ ] Renderer settings (colorSpace, toneMapping, etc.) saved to `renderer_config` and restored on load
- [ ] Post-processing can be enabled per-effect with live viewport preview
- [ ] Display Presets (Neutral, Eevee, Unreal, Unity HDRP, Product, Studio) apply correctly
- [ ] Fog can be enabled with linear/exp2 type
- [ ] Settings persist to DB and apply in public viewer on reload
- [ ] EffectComposer pipeline doesn't break existing rendering
