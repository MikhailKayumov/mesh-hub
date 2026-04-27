# ITER-4 — Model Editor: Materials & Textures

## Goal

Per-mesh material overrides with full PBR stack. Users can change color, metalness, roughness, emissive, and upload texture maps per mesh. Overrides are stored in DB and applied in the public viewer.

## Status: 🔲 Pending

---

## Backend Changes

### 1. DB Migration

New table: `model_3d.model_material_override`

```sql
CREATE TABLE model_3d.model_material_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES model_3d.model_3d(id) ON DELETE CASCADE,
  mesh_name varchar(255) NOT NULL,
  color_hex varchar(9),
  metalness float8,
  roughness float8,
  emissive_hex varchar(9),
  emissive_intensity float8,
  opacity float8,
  wireframe boolean NOT NULL DEFAULT false,
  texture_map_path text,
  normal_map_path text,
  roughness_map_path text,
  metalness_map_path text,
  emissive_map_path text,
  ao_map_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  UNIQUE (model_id, mesh_name)
);
```

### 2. New submodule — `model-materials`

`server/src/modules/models-3d/materials/`

- `ModelMaterialOverrideEntity`
- DTOs: `MaterialOverrideUpsertDto`, `MaterialOverrideResponseDto`
- `MaterialsService`:
  - `listMaterials(modelId, user)` — all overrides for model
  - `upsertMaterial(modelId, meshName, user, dto)` — create or update by meshName (upsert)
  - `deleteMaterial(modelId, meshName, user)` — soft-delete
  - `uploadTexture(modelId, meshName, user, type, file)` — save texture, update path column
  - `getTextureFile(modelId, meshName, type)` — stream / redirect
- `MaterialsController`:
  - `GET /models-3d/:id/materials`
  - `PUT /models-3d/:id/materials/:meshName`
  - `DELETE /models-3d/:id/materials/:meshName`
  - `POST /models-3d/:id/materials/:meshName/texture/:type` (types: `map|normal|roughness|metalness|emissive|ao`)
  - `GET /models-3d/:id/materials/:meshName/texture/:type` — `@Public()`

Texture file limits: max 5 MB, accept PNG / JPEG / WebP.

---

## Frontend — Three.js

### 3. Runtime material application

When model loads → apply all material overrides from `useDisplayConfigQuery`:

```ts
function applyMaterialOverrides(model: Object3D, overrides: MaterialOverrideDto[]) {
  model.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const override = overrides.find(o => o.meshName === child.name);
    if (!override) return;
    const mat = child.material as MeshStandardMaterial;
    if (override.colorHex) mat.color.set(override.colorHex);
    if (override.metalness !== null) mat.metalness = override.metalness;
    if (override.roughness !== null) mat.roughness = override.roughness;
    if (override.emissiveHex) mat.emissive.set(override.emissiveHex);
    if (override.textureMapPath) mat.map = textureLoader.load(override.textureMapPath);
    if (override.aoMapPath) mat.aoMap = textureLoader.load(override.aoMapPath);
    // ...etc
    mat.needsUpdate = true;
  });
}
```

---

## Frontend — Model Editor

### 4. New "Materials" tab

File: `client/src/pages/Editor/panels/tabs/MaterialsTab.tsx`

**Mesh list** — extracted from `viewer.world.scene` via `traverse()`:

```
┌─────────────────────────────────┐
│  ⬛ Mesh_body    [Modified]  │  ← NavLink (active when selected) + colored swatch
│  ⬛ Mesh_wheel               │
│  ⬛ Mesh_glass               │
└─────────────────────────────────┘
```

- Use Mantine `NavLink` for each row (built-in active state styling)
- Color swatch: `Box w={14} h={14} style={{ borderRadius: 3, background: colorHex ?? '#888' }}` inline before name
- `Badge variant="dot" color="yellow" size="sm"` when override exists for that mesh
- `ScrollArea` wrapping the list

**Override editor** (shown below mesh list when a mesh is selected; use `Collapse` for animation):

- `ColorInput` (Mantine) for `colorHex` — includes hex input + color picker popup
- `NumberInputSlider` for Metalness (0–1), Roughness (0–1), Emissive Intensity (0–5), Opacity (0–1)
- `ColorInput` for `emissiveHex`
- `Switch` for Wireframe mode

**Texture slots** (6 types: Diffuse, Normal, Roughness, Metalness, Emissive, AO):
```
┌─────────────────────────────────┐
│  Diffuse  [thumb] file.png  ✕  │  ← FileButton + 16px thumbnail + clear ActionIcon
│  Normal   [upload button]    │
└─────────────────────────────────┘
```
- Each slot: `Group` with label (`Text size="xs" w={70}`), `FileButton` trigger ("Upload"), `Image` thumbnail 16×16 if already uploaded, `ActionIcon IconX` to remove
- Upload → `useUploadTextureMutation()` (multipart)

**Actions:**
- Save button → `useUpsertMaterialMutation({ modelId, meshName, ...dto })`; `loading={isUpserting}`
- "Reset to original" `Button variant="subtle" color="red"` → `modals.openConfirmModal({ title: 'Reset material?', ... })` then `useDeleteMaterialMutation`

### 5. RTK Query — materials endpoints

File: `client/src/app/api/materials.ts` (new, injected into Api)

- `useMaterialsQuery(modelId)`
- `useUpsertMaterialMutation()`
- `useDeleteMaterialMutation()`
- `useUploadTextureMutation()` (multipart)

### 6. Model Editor tabs — add Materials tab

File: `client/src/pages/Editor/panels/` (existing tab list)

Add "Materials" tab after "Lights" tab.

---

## Acceptance Criteria

- [ ] Materials tab lists all named meshes with color swatch + "Modified" badge when override exists
- [ ] `ColorInput` (Mantine) used for base color and emissive color pickers
- [ ] `NumberInputSlider` used for all float sliders (metalness, roughness, opacity, emissive intensity)
- [ ] User can upload 6 texture types per mesh (including AO map)
- [ ] Each texture slot shows thumbnail when uploaded + clear button
- [ ] `aoMap` applied correctly in Three.js (requires `uv2` — note in code if needed)
- [ ] Overrides apply in the viewport in real time on save
- [ ] Overrides persist and apply in public viewer on page load
- [ ] Reset shows confirmation dialog before removing the override
