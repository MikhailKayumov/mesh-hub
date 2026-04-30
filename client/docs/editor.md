# Editor Page

The model-level editor. Configures the per-model display settings (environment, lights, materials, post-processing, renderer settings) and surfaces threaded review (comments / annotations / versions / audio) for a single 3D model. Persists to the server-side `model_display_config` and `model_material_override` tables. Mounted **outside** `BasePage` so it can take the full viewport.

**Route:** `/editor/:id` — see [`app/router/index.tsx`](../src/app/router/index.tsx) and [routing.md](./routing.md).
**Entry:** [`src/pages/Editor/index.tsx`](../src/pages/Editor/index.tsx).

---

## Page Layout

`EditorPage` renders a Mantine `AppShell` with a fixed-height header and footer, an icon-only navbar on the right, and the `Model3DViewer` widget in the centre. If `:id` does not resolve to a model, the shell is replaced by a `NotFoundError`.

```
┌──────────────────────────────────────────────────────────────────────┐
│ AppShell.Header  — Header (model name + screenshot, theme, close)   │
├────────────────────────────────────────────┬─────────────────────────┤
│ AppShell.Main                              │ AppShell.Navbar (360)   │
│  <Model3DViewer                            │  Mantine <Tabs>         │
│     model={model3d}                        │   icon-only Tabs.List   │
│     displayConfig={...}                    │   one Tabs.Panel per    │
│     materialOverrides={...}                │   tab value             │
│     onReady={onViewerReady}/>              │                         │
│  <LoadingOverlay/> while !viewer           │                         │
├────────────────────────────────────────────┴─────────────────────────┤
│ AppShell.Footer  — Footer (file info, draw call / triangle stats)   │
└──────────────────────────────────────────────────────────────────────┘
```

| Region | Component | Source |
|---|---|---|
| Header | `Header` | [`components/Header/`](../src/pages/Editor/components/Header/) |
| Navbar (tab shell) | `Navbar` | [`components/Navbar/index.tsx`](../src/pages/Editor/components/Navbar/index.tsx) |
| Main canvas | `Main` (mounts `Model3DViewer`) | [`components/Main/index.tsx`](../src/pages/Editor/components/Main/index.tsx) |
| Footer | `Footer` | [`components/Footer/`](../src/pages/Editor/components/Footer/) |

`AppShell` config:

```ts
header  = { height: rem(30) }
footer  = { height: rem(26) }
navbar  = { width: 360, breakpoint: 'sm', collapsed: { mobile: true } }
```

The page also wraps everything in `Model3DContextProvider` so any descendant can read the loaded `Model3DResponseDto` via `useModel3DContext()` — see [`shared/contexts/Model3DContext/`](../src/shared/contexts/Model3DContext/).

---

## Navbar Tabs

Tab values are typed by `TabValue` and listed in `TabValues` ([`components/Navbar/constants.ts`](../src/pages/Editor/components/Navbar/constants.ts)). The tab shell renders icons only — labels are not rendered (the `getTabsConfig()` helper places a Tabler icon directly as the tab `title`). The `getTabsConfig()` helper lives in [`components/Navbar/utils.tsx`](../src/pages/Editor/components/Navbar/utils.tsx) and matches the editor-tab convention documented in [client/AGENTS.md → UI/UX Conventions](../AGENTS.md#uiux-conventions). Note: the AGENTS convention also calls for `Tooltip` wrappers on icon-only tabs; this editor's tabs render bare icons (the per-tab content components do use `Tooltip` on their internal `ActionIcon`s).

| Tab value | Icon | Component | Purpose |
|---|---|---|---|
| `display-config` | `IconPhotoEdit` | `DisplayConfigTab` ([`DisplayConfigTab/`](../src/pages/Editor/components/Navbar/components/DisplayConfigTab/)) | Environment (HDRI + ambient + background colour), Fog, Post-Processing (Bloom / Vignette / SSAO / DoF / Color Correction), Renderer settings (tone mapping, exposure, shadow map, color space, clear color), and named `DISPLAY_PRESETS`. Has explicit `Save display config` button. |
| `scene` | `IconCube` | `SceneTab` ([`SceneTab/`](../src/pages/Editor/components/Navbar/components/SceneTab/)) | Scene outliner + per-`Object3D` form (position / rotation / scale / visible) + camera-layer toggles + mesh-stats card. |
| `lights` | `IconBulb` | `LightsTab` ([`LightsTab/`](../src/pages/Editor/components/Navbar/components/LightsTab/)) | Add / edit / remove `model_light` rows (`directional` / `point` / `spot`): color, intensity, position, cast-shadow. Each row mutates immediately. |
| `comments` | `IconMessageCircle` | `ReviewPanel` widget ([`widgets/ReviewPanel`](../src/widgets/ReviewPanel/)) | Threaded comments on the model. |
| `annotations` | `IconMapPin` | `AnnotationManager` widget ([`widgets/AnnotationManager`](../src/widgets/AnnotationManager/)) | 3D annotation pins overlaid on the model. `canEdit` always true on this page. |
| `versions` | `IconClockHour4` | `VersionHistory` widget ([`widgets/VersionHistory`](../src/widgets/VersionHistory/)) | Model version list / restore. |
| `materials` | `IconPalette` | `MaterialsTab` ([`MaterialsTab/`](../src/pages/Editor/components/Navbar/components/MaterialsTab/)) | Per-mesh material override: base color, metalness, roughness, emissive, opacity, wireframe, plus six texture slots (`map`, `normal`, `roughness`, `metalness`, `emissive`, `ao`). |
| `audio` | `IconVolume` | `AudioTab` ([`AudioTab/`](../src/pages/Editor/components/Navbar/components/AudioTab/)) | Upload / preview / delete model audio tracks. |

There is no `animation` tab on this page — animation editing lives in the scene editor (see [scene-editor.md](./scene-editor.md)).

`getTabsConfig()` returns `undefined` until the viewer is ready, so the `Tabs.List` is empty during initial load. `defaultTab` defaults to `TabValues.Scene`.

---

## Unsaved-State / Saving Convention

Per [client/AGENTS.md → UI/UX Conventions](../AGENTS.md#uiux-conventions), forms with pending DB changes show a dirty `Badge` / `dot` and `loading={isSaving}` on the Save button. In this editor the convention is implemented **inside the tab content** (not on the tab icon):

| Location | Indicator |
|---|---|
| `DisplayConfigTab` | `Badge size="xs" variant="dot" color="yellow"` "Unsaved changes" above the Save button when `isDirty`; `<Button loading={isSaving} disabled={!isDirty}>` for the save action. Local form mirrors the remote DTO and re-seeds whenever the query data changes. |
| `MaterialsTab` | `Badge variant="dot" color="yellow"` "override" on each mesh `NavLink` whose row has a persisted override. Per-mesh Save / Reset buttons mutate immediately (no page-level save). |
| `LightsTab` | `LoadingOverlay` covers each in-flight light form (`isSaving={isAdding}` / `isUpdating`). No badge — every change is a fresh mutation. |
| Header `IconDeviceFloppy` | Currently unwired (placeholder Save icon in [`Header/index.tsx`](../src/pages/Editor/components/Header/index.tsx)) — saves are per-tab. |

---

## RTK Query Mutations

All endpoints inject into the single base `Api` (see [api.md](./api.md) and [state-management.md](./state-management.md)). The two tag families used by this page are `DisplayConfig` and `Materials` (see [`app/api/tags.ts`](../src/app/api/tags.ts)).

### Display config — [`app/api/display-config.ts`](../src/app/api/display-config.ts)

| Hook | HTTP / URL | Tag effect |
|---|---|---|
| `useGetDisplayConfigQuery` | `GET models-3d/:id/display-config` | provides `DisplayConfig:{id}` |
| `useUpdateDisplayConfigMutation` | `PATCH models-3d/:id/display-config` | invalidates `DisplayConfig:{id}` |
| `useUploadDisplayHdriMutation` | `POST models-3d/:id/display-config/hdri` | invalidates `DisplayConfig:{id}` |
| `useRemoveDisplayHdriMutation` | `DELETE models-3d/:id/display-config/hdri` | invalidates `DisplayConfig:{id}` |
| `useAddModelLightMutation` | `POST models-3d/:id/display-config/lights` | invalidates `DisplayConfig:{id}` |
| `useUpdateModelLightMutation` | `PATCH models-3d/:id/display-config/lights/:lightId` | invalidates `DisplayConfig:{id}` |
| `useRemoveModelLightMutation` | `DELETE models-3d/:id/display-config/lights/:lightId` | invalidates `DisplayConfig:{id}` |

Lights are nested under display config, so any light mutation re-fetches the parent config and the lights list refreshes via the same query subscription.

### Materials — [`app/api/materials.ts`](../src/app/api/materials.ts)

| Hook | HTTP / URL | Tag effect |
|---|---|---|
| `useGetMaterialsQuery` | `GET models-3d/:id/materials` | provides `Materials:{id}` |
| `useUpsertMaterialMutation` | `PUT models-3d/:id/materials/:meshName` | invalidates `Materials:{id}` |
| `useDeleteMaterialMutation` | `DELETE models-3d/:id/materials/:meshName` | invalidates `Materials:{id}` |
| `useUploadMaterialTextureMutation` | `POST models-3d/:id/materials/:meshName/texture/:type` | invalidates `Materials:{id}` |
| `useDeleteMaterialTextureMutation` | `DELETE models-3d/:id/materials/:meshName/texture/:type` | invalidates `Materials:{id}` |

`meshName` is `encodeURIComponent`-ed before insertion into the URL.

---

## Boundary with `Model3DViewer`

`EditorPage` mounts the viewer once via `<Main>`. The flow is:

1. `EditorPage` reads `displayConfig` and `materialOverrides` via RTK Query and passes both to `<Main>` → `<Model3DViewer>` as props (see [`Main/index.tsx`](../src/pages/Editor/components/Main/index.tsx)).
2. `Model3DViewer` constructs a `Viewer` instance and emits `onReady(viewer)` once initialised (see [3d-viewer.md](./3d-viewer.md)).
3. `useEditor()` ([`hooks/useEditor.ts`](../src/pages/Editor/hooks/useEditor.ts)) stores that `Viewer` in state, spawns debug helpers (grid / axis / ground plane / scene bbox) sized to the model bbox, and enables camera layer 10 to make them visible. The `Navbar` and `Footer` receive the same `Viewer` through props.
4. Tab components mutate the server (RTK Query) **and** apply the change to the live `Viewer` for instant feedback:
   - `DisplayConfigTab.applyConfigToViewer()` → `viewer.world.setBackgroundColor / setAmbientLight / setFog`, `viewer.renderer.setSettings`, `viewer.renderer.setPostProcessing`.
   - `LightsTab` → `viewer.world.syncLights(...)` after each mutation resolves.
   - `MaterialsTab` → `viewer.world.applyMaterialOverrides(...)` after upsert / delete / texture changes.
5. `MaterialsTab` subscribes to `WorldEventNames.WorldSceneChange` to refresh its mesh-name list whenever the scene graph changes.

This split keeps the React layer responsible for form state + persistence and leaves all WebGL state mutation inside the viewer classes — see [3d-viewer.md](./3d-viewer.md) and [widgets.md](./widgets.md).

---

## `useEditor` Hook

[`hooks/useEditor.ts`](../src/pages/Editor/hooks/useEditor.ts) — owns the `Viewer` reference at the page level.

```ts
function useEditor(): {
  viewer: Viewer | null;
  isViewerLoading: boolean;
  onViewerReady: (newViewer: Viewer) => void;
}
```

| Concern | Behaviour |
|---|---|
| Viewer init | `onViewerReady` is passed to `<Model3DViewer onReady={...} />`. It stores the viewer and bumps an internal `key` to retrigger the helpers effect. |
| Helpers | `addHelpers(viewer, isLight, theme)` is called whenever `viewer`, `key`, `isLight`, or `theme` changes. Spawns Grid / Axis / Ground / Scene-BBox helpers scaled to `viewer.model?.sceneBoundingBox`. |
| Loading state | `isViewerLoading` flips false in a `queueMicrotask` after helpers are spawned, so the `<LoadingOverlay>` over the canvas matches the first paint. |
| Layer toggle | `viewer.camera.enableLayer([10])` after spawning helpers so they are visible by default. |

---

## Component Tree

```
EditorPage
├─ Header                       components/Header/
├─ Navbar                       components/Navbar/
│   └─ <Tabs> (icon-only, 8 panels via getTabsConfig)
│       ├─ DisplayConfigTab     components/Navbar/components/DisplayConfigTab/
│       ├─ SceneTab             components/Navbar/components/SceneTab/
│       │   ├─ Object3DOutliner ../../components/Object3DOutliner/
│       │   ├─ Object3DForm     ../../components/Forms/Object3DForm/
│       │   ├─ LayersCheckboxGroup ../../components/LayersCheckboxGroup/
│       │   └─ MeshStatsCard    SceneTab/components/MeshStatsCard/
│       ├─ LightsTab            components/Navbar/components/LightsTab/
│       ├─ ReviewPanel (widget)
│       ├─ AnnotationManager (widget)
│       ├─ VersionHistory (widget)
│       ├─ MaterialsTab         components/Navbar/components/MaterialsTab/
│       └─ AudioTab             components/Navbar/components/AudioTab/
├─ Main                         components/Main/
│   └─ Model3DViewer (widget)
└─ Footer                       components/Footer/
```

---

## Sub-Components (Scene tab)

The Scene tab pulls in shared pieces also used by the scene editor:

| Component | Path | Purpose |
|---|---|---|
| `Object3DOutliner` | [`components/Object3DOutliner/`](../src/pages/Editor/components/Object3DOutliner/) | Tree view of `Viewer.world.scene` children — `Tree` → `Node` → `Group` / `Leaf`. Subscribes to `WorldEventNames.WorldSceneChange`. |
| `Object3DForm` | [`components/Forms/Object3DForm/`](../src/pages/Editor/components/Forms/Object3DForm/) | `position` / `rotation` / `scale` / `visible` form, Mantine `@mantine/form` + Zod. |
| `Vector3Field` / `ScalarField` | [`components/Fields/`](../src/pages/Editor/components/Fields/) | Numeric fields used by `Object3DForm`; scroll wheel adjusts via `useChangeScalarOnWheel` ([`hooks/useChangeScalarOnWheel.ts`](../src/pages/Editor/hooks/useChangeScalarOnWheel.ts)). |
| `LayersCheckboxGroup` | [`components/LayersCheckboxGroup/`](../src/pages/Editor/components/LayersCheckboxGroup/) | Toggles `viewer.camera.enableLayer / disableLayer`. |
| `CollapseSection` | [`components/CollapseSection/`](../src/pages/Editor/components/CollapseSection/) | Generic labelled `Mantine.Collapse` wrapper. |

---

## `model.ts` Files

Per the FSD rules, per-feature local types live in `model.ts` and are not re-exported through `index.ts`:

| File | Contents |
|---|---|
| `hooks/model.ts` | Editor hook state types |
| `components/Navbar/model.ts` | `TabValue` union + `TabsConfig` |
| `components/Navbar/components/SceneTab/model.ts` | Scene tab props |
| `components/Object3DOutliner/model.ts` | Outliner node + selection types |
| `components/Forms/Object3DForm/model.ts` | Object3D form schema |
| `components/CollapseSection/model.ts` | CollapseSection props |
| `components/LayersCheckboxGroup/model.ts` | Layer checkbox data |

---

## See Also

- [3d-viewer.md](./3d-viewer.md) — `Model3DViewer` widget, `Viewer` / `World` / `Renderer` / `CameraController` classes.
- [scene-editor.md](./scene-editor.md) — multi-object scene editor; sibling page that owns the `animation` workflow.
- [widgets.md](./widgets.md) — `ReviewPanel`, `AnnotationManager`, `VersionHistory`, `NumberInputSlider`, `EmptyData`, etc.
- [api.md](./api.md) — RTK Query base instance, `Api.injectEndpoints`, tag conventions.
- [routing.md](./routing.md) — route table including `/editor/:id`.
