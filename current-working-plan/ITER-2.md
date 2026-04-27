# ITER-2 — Scene Editor: Complete UI

## Goal

Make the Scene Editor fully functional: add/remove objects from a model library, manage lights (add/edit/delete), configure environment (HDRI, background, ambient), and support scene annotations/review tab.

## Status: 🔲 Pending

---

## Missing Features (current state)

| Feature | Status |
|---|---|
| Add Object button in SceneObjectsPanel | ❌ Missing |
| Lights panel (add/edit/delete) | ❌ Missing |
| Config panel (HDRI, background, ambient) | ❌ Missing |
| Scene Editor tab navigation | ❌ Only Objects panel in navbar |

---

## Frontend Changes

### 1. `SceneObjectsPanel` — Add Object

File: `client/src/pages/SceneEditor/panels/SceneObjectsPanel.tsx`

- Add "+" button in panel header
- Opens `AddModelToSceneModal` — lists user's models + workspace models
- On select → `useAddSceneObjectMutation({ sceneId, body: { modelId } })`
- Shows plan limit error (ForbiddenException → toast)

**New file:** `client/src/pages/SceneEditor/panels/AddModelToSceneModal.tsx`

- Query: `useCurrentUser3DModelsQuery()` + optionally workspace models via `useModels3DQuery({ workspaceId })` if the scene has a `workspaceId` set
- **Note:** `useModels3DQuery({ workspaceId })` must be added as an RTK endpoint in this iteration (backend already supports `GET /models-3d?workspaceId=uuid`)
- `TextInput` with `IconSearch` for filtering by name (client-side filter on loaded list)
- `SimpleGrid cols={{ base: 2, sm: 3 }}` of model cards (thumbnail + name + format `Badge`)
- **Loading state:** `Skeleton` grid (6 cards) while `isLoading=true`
- **Empty state:** `EmptyData` widget with "Upload a model first" label
- Click → adds to scene with default position (0,0,0) + scale (1,1,1)

### 2. New `SceneLightsPanel`

File: `client/src/pages/SceneEditor/panels/SceneLightsPanel.tsx`

**Light list item design:**
```
┌─────────────────────────────────┐
│  ⬤  ☀️ Directional  [1.0]     ••  │
└─────────────────────────────────┘
↑ color dot   type icon  Badge(intensity)  hover: edit+delete icons
```
- `Paper` row with subtle border
- Color dot: `Box w={12} h={12} style={{ borderRadius: '50%', background: colorHex }}`
- Type icon: `IconSun` (directional) / `IconBulb` (point) / `IconFocus2` (spot)
- Intensity `Badge variant="light" size="sm"`
- Hover reveals `ActionIcon` edit (`IconPencil`) and delete (`IconTrash`)
- Add button (`IconPlus`) in panel header → opens inline form below list
- Inline add/edit form: `Select` for type + `ColorInput` for color + intensity `NumberInputSlider` + position XYZ `NumberInput`s
- Edit (click light row) → expand same inline form
- Delete → `modals.openConfirmModal()` first, then `useRemoveSceneLightMutation`
- Save → `useAddSceneLightMutation` / `useUpdateSceneLightMutation`
- **Empty state:** `EmptyData` widget with "Add your first light" + add button
- **Loading state:** `LoadingOverlay` while mutations are in-flight

### 3. New `SceneConfigPanel`

File: `client/src/pages/SceneEditor/panels/SceneConfigPanel.tsx`

Group settings with `Divider label="..."` separators:

**Background section:**
- `ColorInput` (Mantine) for background color → `updateScene({ config: { backgroundColor } })`

**Ambient section:**
- Intensity slider 0–5 using existing `NumberInputSlider` widget

**Environment section:**
- HDRI upload: `Dropzone` from `@mantine/dropzone` accepting `.hdr` only, max 20 MB
- HDRI status: "None" text OR `Badge` with filename + `ActionIcon IconX` to remove
- `LoadingOverlay` on the section while HDRI is uploading

**Fog section:**
- `Switch` to enable fog
- `Collapse` → type `Select` (linear / exp2) + `ColorInput` + near/far `NumberInput`s *(full DB persistence in ITER-3)*

### 4. Scene Editor Tab Navigation

File: `client/src/pages/SceneEditor/SceneEditorPage.tsx`

Current: single navbar panel (Objects).
New: **icon-only tabs** in the navbar — matching the Model Editor `Tabs` pattern (`TabValues` const + `getTabsConfig()` function).

```
Navbar (260px):
  ┌─────────────────────┐
  │  📂   💡   ⚙️        │  ← IconCube / IconBulb / IconSettings (with Tooltip)
  ├─────────────────────┤
  │  [active panel]      │
  └─────────────────────┘
```

Tab icons:
- Objects → `IconCube`, `Tooltip label="Objects"`
- Lights → `IconBulb`, `Tooltip label="Lights"`
- Config → `IconSettings`, `Tooltip label="Scene Config"`

*(ITER-5 adds Animations tab `IconPlayerPlay`; ITER-7 adds Review tab `IconMessage`)*

Extract `SceneTabValues` constant and `getSceneTabsConfig()` helper (same pattern as `client/src/pages/Editor/components/Navbar/constants.ts` and `utils.tsx`).

### 5. `ScenePropertiesPanel` — upgrade aside for light selection

File: `client/src/pages/SceneEditor/panels/ScenePropertiesPanel.tsx`

Currently only handles object transform. Upgrade to handle selection type:

```tsx
type SelectionState =
  | { type: 'object'; id: string }
  | { type: 'light'; id: string }
  | null;
```

- **Object selected** → existing `ObjectTransformPanel` (position / rotation / scale)
- **Light selected** → `LightPropertiesPanel` inline: type `Select`, `ColorInput`, intensity `NumberInputSlider`, position XYZ, cast shadow `Switch`
- **Nothing selected** → scene info card: scene name + visibility `Badge`, object count, light count, "Last saved" timestamp — use `Stack` of `Text` lines in a `Paper` card

### 6. Three.js — apply config changes in real-time

File: `client/src/pages/SceneEditor/hooks/useSceneViewer.ts`

- Expose `updateRendererConfig(config: Partial<SceneConfig>)` method
- Background color → `renderer.setSettings({ clearColor })`
- Ambient → `world.setAmbientLight(intensity)`
- HDRI → `world.loadHdri(url)` after upload mutation succeeds
- Light add/remove/update → `world.syncLights(lights: SceneLightDto[])` — rebuild Three.js light objects from DTO array

---

## UI/UX Conventions (apply to all Scene Editor panels)

- **Toast errors**: all mutation failures show `notifications.show({ color: 'red', title: 'Error', message: err.message })`
- **Confirm dialogs**: every destructive action (remove object, delete light) uses `modals.openConfirmModal()`
- **Empty states**: every empty list uses the `EmptyData` widget with a CTA
- **Skeleton loading**: card/list data shows `Skeleton` placeholders while `isLoading=true`
- **Tooltips**: every icon-only button wrapped in `<Tooltip label="...">`

---

## Acceptance Criteria

- [ ] User can add a model from their library to the scene (with search + skeleton loading)
- [ ] `AddModelToSceneModal` shows skeleton while loading, empty state when no models exist
- [ ] User can add / edit / delete directional, point, and spot lights with confirm on delete
- [ ] Light list items show color dot + type icon + intensity badge
- [ ] Selecting a light shows its properties in the aside panel
- [ ] Nothing selected → aside shows scene info card
- [ ] User can set background color and ambient light intensity
- [ ] User can upload an HDRI and see it applied in the viewport
- [ ] Scene Editor uses icon-only tabs (same visual pattern as Model Editor)
- [ ] All changes persist after page reload
- [ ] Plan limits (maxLights, maxObjects) shown as toasts on error
