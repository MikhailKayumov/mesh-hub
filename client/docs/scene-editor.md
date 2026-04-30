# Scene Editor

Workspace- (and user-) scoped multi-object scene editor. Loads a `SceneResponseDto`, instantiates a `Viewer` against an `<AppShell>` container, places 3D models from the catalogue onto a stage, configures lights, edits per-object animation/audio, captures a thumbnail, uploads an HDRI environment, and overlays annotation pins + threaded comments. All editing flows go through the [`scenes.ts`](../src/app/api/scenes.ts) and [`scene-reviews.ts`](../src/app/api/scene-reviews.ts) RTK Query slices and round-trip server-side. The page lives in [`pages/SceneEditor/`](../src/pages/SceneEditor/) and is mounted from two routes (workspace and personal/user); the public read-only counterpart is [`pages/PublicScene/`](../src/pages/PublicScene/).

---

## Routes

Both routes resolve the same `SceneEditorPage` component (lazy-loaded). See [`app/router/index.tsx`](../src/app/router/index.tsx).

| Route | URL params consumed | Notes |
|---|---|---|
| `/user/scenes/:sceneId` | `sceneId` | Personal scene. `scene.workspaceId === null`, `scene.userId === <current user>`. The top bar's "Back" link still falls back to the workspace breadcrumb pattern — there is no workspace context. |
| `/org/:orgId/workspace/:workspaceId/scenes/:sceneId` | `orgId`, `workspaceId`, `sceneId` | Workspace-scoped scene. `scene.workspaceId` is set; org membership is enforced server-side. |

`SceneEditorPage` reads only `:sceneId` via `useParams`. The other params are consumed by [`SceneEditorTopBar`](../src/pages/SceneEditor/panels/SceneEditorTopBar.tsx) to build the "Scenes" breadcrumb back-link.

The public read-only route `/scenes/:sceneId` is mounted by `PublicScenePage` (a different component) — see [Public Scene](#public-scene).

---

## Page Layout

`SceneEditorPage` ([`SceneEditorPage.tsx`](../src/pages/SceneEditor/SceneEditorPage.tsx)) renders a Mantine `AppShell` with a header, a left navbar (260px), a centre canvas, and a right aside (280px). The aside is collapsed on mobile when nothing is selected.

```
┌──────────────────────────────────────────────────────────────────────┐
│ AppShell.Header  — SceneEditorTopBar (breadcrumb + screenshot/thumb) │
├─────────┬────────────────────────────────────────────┬───────────────┤
│ Navbar  │ AppShell.Main                              │ Aside         │
│ (260)   │  <Box ref={containerRef}>                  │ (280)         │
│ tabs:   │   ← Viewer's WebGL <canvas> mounts here    │ Properties    │
│         │   <Loader/> overlay while isSceneLoading   │ panel         │
│  Obj    │                                            │  - selected   │
│  Light  │                                            │    object     │
│  Cfg    │                                            │  - selected   │
│  Anim   │                                            │    light      │
│  Rev    │                                            │  - else: info │
└─────────┴────────────────────────────────────────────┴───────────────┘
```

| Region | Component | Source |
|---|---|---|
| Header | `SceneEditorTopBar` | [`panels/SceneEditorTopBar.tsx`](../src/pages/SceneEditor/panels/SceneEditorTopBar.tsx) |
| Navbar (tab shell) | `SceneNavbar` | [`components/Navbar/SceneNavbar.tsx`](../src/pages/SceneEditor/components/Navbar/SceneNavbar.tsx) |
| Navbar tab: Objects | `SceneObjectsPanel` | [`panels/SceneObjectsPanel.tsx`](../src/pages/SceneEditor/panels/SceneObjectsPanel.tsx) |
| Navbar tab: Lights | `SceneLightsPanel` | [`panels/SceneLightsPanel.tsx`](../src/pages/SceneEditor/panels/SceneLightsPanel.tsx) |
| Navbar tab: Config | `SceneConfigPanel` | [`panels/SceneConfigPanel.tsx`](../src/pages/SceneEditor/panels/SceneConfigPanel.tsx) |
| Navbar tab: Animations | `SceneAnimationsPanel` | [`panels/SceneAnimationsPanel.tsx`](../src/pages/SceneEditor/panels/SceneAnimationsPanel.tsx) |
| Navbar tab: Review | `SceneReviewPanel` | [`panels/SceneReviewPanel.tsx`](../src/pages/SceneEditor/panels/SceneReviewPanel.tsx) |
| Main canvas | `<Box ref={containerRef}>` (Viewer mount) | `SceneEditorPage.tsx` |
| Aside | `ScenePropertiesPanel` | [`panels/ScenePropertiesPanel.tsx`](../src/pages/SceneEditor/panels/ScenePropertiesPanel.tsx) |
| Add-model modal | `AddModelToSceneModal` | [`panels/AddModelToSceneModal.tsx`](../src/pages/SceneEditor/panels/AddModelToSceneModal.tsx) |

Tab values are typed by the `SceneTabValues` const in [`components/Navbar/constants.ts`](../src/pages/SceneEditor/components/Navbar/constants.ts) (`objects | lights | config | animations | review`). Tabs are vertical with tooltip-only labels; tab contents are produced by [`getSceneTabsConfig`](../src/pages/SceneEditor/components/Navbar/utils.tsx).

`SceneNavbar` performs an automatic tab switch: when `selectionState` flips to a `'light'` selection, the Lights tab activates. This is implemented as a "set state during render on prop change" pattern using a `prevSelection` shadow state.

---

## Editor Lifecycle

The page coordinates a single RTK Query read with a Three.js [`Viewer`](../src/widgets/Model3DViewer/classes/Viewer/Viewer.ts) instance owned by the [`useSceneViewer`](../src/pages/SceneEditor/hooks/useSceneViewer.ts) hook.

| Step | Trigger | Action |
|---|---|---|
| 1. Fetch | `:sceneId` param | `useSceneQuery({ sceneId })` returns `SceneResponseDto`. Loader spinner while pending; "Scene not found." if undefined. |
| 2. Title + recent | `scene.id` settled | `useDocumentTitle(scene.name)` and `pushRecent(user.id, 'scene', …)` (recently-opened cache). |
| 3. Viewer init | First mount of `containerRef` | `new Viewer(container).init().run()` — see [`useSceneViewer` effect 1](../src/pages/SceneEditor/hooks/useSceneViewer.ts). One-shot; cleanup destroys the viewer. |
| 4. Scene load | `scene` value changes | `viewer.loadScene(scene)` clears the world, loads each object via `Loader`, applies transforms, registers `AnimationMixer`s, adds lights, loads HDRI if present, optionally fly-tos `scene.config.cameraBookmarks[0]`. |
| 5. Audio autoplay | After `loadScene` resolves | For each object whose `audioConfig.autoplay && audioId`, the hook calls `viewer.playAudio(...)` (positional or stereo). |
| 6. Edit (transform) | `ScenePropertiesPanel` sliders | Debounced 400 ms `useUpdateSceneObjectMutation` PATCH — invalidates `Scene/:id`, refetches, RTK Query reloads the scene → step 4 re-runs. |
| 7. Edit (light) | `SceneLightsPanel` form | Mutations invalidate the scene tag, then call `syncLights(scene.lights)` so the viewer can splice live without a full reload. |
| 8. Thumbnail | "Capture thumbnail" button | `viewer.renderer.getScreenshot()` → base64 PNG → `useUploadSceneThumbnailMutation`. |
| 9. Screenshot download | "Download screenshot" button | Same screenshot data URL converted to a `Blob` and triggered as a download — no server hit. |

There is **no debounced page-level autosave** — every editable field is its own mutation. Numeric transform fields and config sliders use 400 ms debouncing locally before firing. There is no explicit "Save" button.

`isSceneLoading` is a derived flag (`!!viewer && !!scene && scene !== loadedScene`) used to dim the canvas and short-circuit the animations panel during reload.

---

## Mutation Flow (RTK Query)

All endpoints live in [`scenes.ts`](../src/app/api/scenes.ts) (scene CRUD + objects + lights + assets) and [`scene-reviews.ts`](../src/app/api/scene-reviews.ts) (annotations + comments). Cache tags from [`tags.ts`](../src/app/api/tags.ts).

### `scenes.ts`

| Hook | Method · URL | Invalidates |
|---|---|---|
| `useSceneQuery` | `GET scenes/:sceneId` | provides `Scene/:id` |
| `useScenesQuery` | `GET scenes?workspaceId&userId&search` | provides `Scenes/:workspaceId\|userId\|'personal'` |
| `useCreateSceneMutation` | `POST scenes` | `Scenes/:workspaceId\|'personal'` |
| `useUpdateSceneMutation` | `PATCH scenes/:sceneId` | `Scene/:id`, `Scenes` |
| `useDeleteSceneMutation` | `DELETE scenes/:sceneId` | `Scenes/:workspaceId\|'personal'` |
| `useAddSceneObjectMutation` | `POST scenes/:sceneId/objects` | `Scene/:id` |
| `useUpdateSceneObjectMutation` | `PATCH scenes/:sceneId/objects/:objectId` | `Scene/:id` |
| `useRemoveSceneObjectMutation` | `DELETE scenes/:sceneId/objects/:objectId` | `Scene/:id` |
| `useAddSceneLightMutation` | `POST scenes/:sceneId/lights` | `Scene/:id` |
| `useUpdateSceneLightMutation` | `PATCH scenes/:sceneId/lights/:lightId` | `Scene/:id` |
| `useRemoveSceneLightMutation` | `DELETE scenes/:sceneId/lights/:lightId` | `Scene/:id` |
| `useUploadSceneHdriMutation` | `POST scenes/:sceneId/hdri` (multipart) | `Scene/:id` |
| `useUploadSceneThumbnailMutation` | `POST scenes/:sceneId/thumbnail` (base64 body) | `Scene/:id`, `Scenes` |
| `useCloneSceneMutation` | `POST scenes/:id/clone` | `Scenes/:workspaceId\|userId\|'personal'` |

Visibility and `cameraBookmarks` are not separate endpoints — they are partial fields on `SceneUpdateRequestDto` (see [`dto.ts`](../src/app/api/dto.ts)) sent through `useUpdateSceneMutation`.

### `scene-reviews.ts`

| Hook | Method · URL | Invalidates |
|---|---|---|
| `useSceneAnnotationsQuery` | `GET scenes/:sceneId/annotations` | provides `SceneAnnotations/:sceneId` |
| `useCreateSceneAnnotationMutation` | `POST scenes/:sceneId/annotations` | `SceneAnnotations/:sceneId` |
| `useUpdateSceneAnnotationMutation` | `PATCH scenes/:sceneId/annotations/:annotationId` | `SceneAnnotations/:sceneId` |
| `useDeleteSceneAnnotationMutation` | `DELETE scenes/:sceneId/annotations/:annotationId` | `SceneAnnotations/:sceneId` |
| `useReorderSceneAnnotationsMutation` | `PUT scenes/:sceneId/annotations/order` | `SceneAnnotations/:sceneId` |
| `useSceneCommentsQuery` | `GET scenes/:sceneId/comments` | provides `SceneComments/:sceneId` |
| `useAddSceneCommentMutation` | `POST scenes/:sceneId/comments` | `SceneComments/:sceneId` |
| `useUpdateSceneCommentMutation` | `PATCH scenes/:sceneId/comments/:commentId` | `SceneComments/:sceneId` |
| `useDeleteSceneCommentMutation` | `DELETE scenes/:sceneId/comments/:commentId` | `SceneComments/:sceneId` |

There is no dedicated public-visibility endpoint — toggling to `public` is a `PATCH scenes/:sceneId` with `{ visibility: 'public' }`.

---

## Boundary with `widgets/Model3DViewer/classes/`

The page UI never touches Three.js objects directly. All viewer-side mutations go through the `Viewer` class API (full surface in [`3d-viewer.md`](3d-viewer.md)).

| Concern | Lives in (UI layer) | Lives in (viewer class layer) |
|---|---|---|
| Add/remove model | `SceneObjectsPanel` + `AddModelToSceneModal` (RTK mutation, then refetch) | `Viewer.loadScene` reloads on next render; `Loader` cache holds GLTFs |
| Edit transform | `ScenePropertiesPanel` (debounced PATCH) | `Viewer.loadScene` re-applies `position`/`rotation`/`scale` per object |
| Edit light | `SceneLightsPanel` form → mutation | `world.syncLights(lights)` adds/updates without full reload |
| Background color | `SceneConfigPanel` color picker | `world.setBackgroundColor(hex)` |
| Ambient light | `SceneConfigPanel` slider | `world.setAmbientLight(intensity)` |
| HDRI | `SceneConfigPanel` Dropzone | `world.loadHdri(url)` (RGBELoader) |
| Selection highlight | `selectObject(id)` callback | `viewer.setSelectedObject(id)` → `world.highlightObject` / `world.clearHighlight` |
| Annotation placement | `SceneAnnotationManager` "Annotate" button | `viewer.setMode('annotate')` + `viewer.onScenePointerDown(cb)` performs raycast and returns `(worldPos, cameraPos, sceneObjectId)` |
| Annotation marker pins | `useEffect` in widget | `world.spawnMarker(id, pos)`, `world.clearMarkers()`, `world.highlightMarker(id)` |
| Camera "fly to" | annotation card "Fly to" | `viewer.camera.flyTo(x, y, z, tx, ty, tz)` |
| Audio playback | `useSceneViewer` autoplay loop + `SceneAnimationsPanel` audio config | `viewer.playAudio(url, opts)` (`PositionalAudio` if `positional && attachTo`) |
| Animations | `SceneAnimationsPanel` clip controls | `viewer.getObjectAnimations(id)`, `viewer.getObjectMixer(id)`, `viewer.getSceneObjectMixerIds()` — UI calls `mixer.clipAction(clip)` directly |
| Screenshot | `SceneEditorTopBar` | `viewer.renderer.getScreenshot()` |

Imports cross the boundary in exactly one direction: pages → widgets. The viewer never imports anything from `pages/`.

`useSceneViewer` is the single integration seam: it owns the `Viewer` instance via a ref, exposes a fixed set of imperative callbacks (`selectObject`, `selectLight`, `captureScreenshot`, `updateBackgroundColor`, `updateAmbientLight`, `loadHdri`, `syncLights`, `getObjectAnimations`, `getObjectMixer`, `getAnimatedObjectIds`), and feeds them to every panel through `SceneNavbar` props.

---

## Scene Object Animation & Audio Config

`SceneObjectResponseDto` carries two opaque JSON columns (added in ITER-8):

| Field | Shape | Edited by |
|---|---|---|
| `animationConfig` | `Record<string, unknown> \| null` (typed loosely on the wire) | `SceneAnimationsPanel` clip selection / play state lives in component state today; nothing is persisted yet — the panel drives the mixer directly. The DTO field is reserved for ITER-8 follow-ups. |
| `audioConfig` | `SceneObjectAudioConfigDto \| null` (`{ audioId, volume?, loop?, autoplay?, positional?, maxDistance? }`) | `ObjectAudioConfig` sub-component inside `SceneAnimationsPanel`. Each switch/slider calls `useUpdateSceneObjectMutation` with `body: { audioConfig: { ...current, ...patch } }`; clearing the track sends `audioConfig: null`. |

Round-trip path for `audioConfig`:

```
SceneAnimationsPanel ─► useUpdateSceneObjectMutation
     ▲                           │
     │                           ▼
useSceneQuery ◄── invalidate Scene/:id ── server PATCH /scenes/:sceneId/objects/:objectId
     │
     └──► useSceneViewer effect: on next loadScene, reads obj.audioConfig.autoplay
          and invokes viewer.playAudio(url, { loop, volume, positional, maxDistance,
          attachTo: positional ? viewer.getSceneObjectGroup(obj.id) : undefined })
```

Tracks are listed via `useListModelAudioQuery({ modelId: obj.model.id })`; if the model has no audio uploads, the section hides itself.

---

## Annotations & Comments

Both surfaces are rendered together inside the **Review** navbar tab via [`SceneReviewPanel`](../src/pages/SceneEditor/panels/SceneReviewPanel.tsx).

### Annotations — [`SceneAnnotationManager`](../src/widgets/SceneAnnotationManager/SceneAnnotationManager.tsx)

- Pins are anchored in world space (`pos: { x, y, z }`) and remember the camera position at creation time (`cameraPos`).
- Optional link to a `sceneObjectId` (set automatically when the user clicks on a meshed object).
- Placement flow: user clicks the toolbar `+` → `viewer.setMode('annotate')` → `viewer.onScenePointerDown(cb)` performs a raycast → on hit, the form opens with the pending `worldPos` / `cameraPos`. Cancelling restores `view` mode.
- Reordering uses `@dnd-kit` (`SortableContext` + `arrayMove`) and persists via `useReorderSceneAnnotationsMutation` with `{ items: [{ id, order }] }`.
- A `useEffect` keyed on `[viewer, annotations]` calls `viewer.world.clearMarkers()` then `viewer.world.spawnMarker(id, pos)` for each annotation so pins live in the same scene graph as models.
- Cards expose "Fly to" (`viewer.camera.flyTo(...)`) and "Highlight linked object" (calls back into `onSelectAnnotation` which the SceneEditor wires to `selectObject`).

### Comments — `ReviewPanel` (`scope="scene"`)

The shared [`ReviewPanel`](../src/widgets/ReviewPanel/) widget runs in `scope="scene"` mode against `useSceneCommentsQuery(sceneId)` and the create/update/delete mutations from [`scene-reviews.ts`](../src/app/api/scene-reviews.ts). Comments are flat with single-level threading (`parentId`) and a `resolved` flag. Unlike model comments, scene comments have no spatial anchoring — pin-style anchoring is the annotation surface above.

---

## Camera Bookmarks

`SceneConfigDto.cameraBookmarks` is an array of `SceneCameraBookmarkDto` (`{ label, posX, posY, posZ, targetX, targetY, targetZ }`) persisted with the rest of the scene config.

Current viewer behaviour ([`Viewer.loadScene`](../src/widgets/Model3DViewer/classes/Viewer/Viewer.ts)): if `scene.config.cameraBookmarks[0]` is set, the camera flies to it after the scene finishes loading.

The DTO and viewer plumbing exist, but **the SceneEditor has no UI surface to add, edit, or jump between bookmarks today**. The only camera fly-to in the active UI is the per-annotation "Fly to" button (using the annotation's `cameraPos`, not a bookmark). Adding bookmark management would extend `SceneConfigPanel` and write through `useUpdateSceneMutation` with `{ config: { cameraBookmarks } }`.

---

## HDRI Upload

Implemented inside [`SceneConfigPanel`](../src/pages/SceneEditor/panels/SceneConfigPanel.tsx).

| Aspect | Behaviour |
|---|---|
| Picker | Mantine `Dropzone`, accepts `.hdr` / `application/octet-stream`, single file, max 20 MB. |
| Upload | `useUploadSceneHdriMutation` posts `multipart/form-data` to `POST scenes/:sceneId/hdri`; invalidates `Scene/:id`. |
| Apply | On success, the panel calls `loadHdri('/api/scenes/:sceneId/hdri')` which forwards to `viewer.world.loadHdri(url)` (RGBELoader → scene environment + background). |
| Indicator | Once `scene.config.environmentHdriPath` is truthy, the dropzone is replaced by a `<Badge>hdri.hdr</Badge>` with a remove button. |
| Remove | `useUpdateSceneMutation` with `{ config: { environmentHdriPath: undefined } }`. |

Subscription-plan gating for HDRI upload happens server-side; the client does not currently hide the controls based on plan. See [`server/docs/scenes.md`](../../server/docs/scenes.md) for the plan-limit enforcement and stored path layout.

---

## Public Scene

`SceneVisibility` is one of `public`, `private`, `unlisted` ([`dto.ts`](../src/app/api/dto.ts)). The current scene visibility renders as a `<Badge>` inside `ScenePropertiesPanel` → `SceneInfoCard`. There is **no toggle UI inside the editor today**; visibility is changed by `useUpdateSceneMutation({ body: { visibility } })`, which any caller can invoke (and which the scenes-list pages do expose).

When a scene's `visibility === 'public'`, it becomes reachable at `/scenes/:sceneId`. The matching route in [`app/router/index.tsx`](../src/app/router/index.tsx) (`RouterPaths.PublicScene`) lazy-loads [`pages/PublicScene/PublicScenePage`](../src/pages/PublicScene/), which is a separate, read-only viewer (no editor panels, no mutations).

---

## Cross-References

- [`routing.md`](routing.md) — how the two scene-editor routes plug into the router tree.
- [`state-management.md`](state-management.md) — RTK Query base + tag invalidation conventions.
- [`3d-viewer.md`](3d-viewer.md) — full `Viewer` / `World` / `CameraController` / `Renderer` API surface.
- [`widgets.md`](widgets.md) — catalogue entry for `SceneAnnotationManager` and `ReviewPanel`.
- [`api.md`](api.md) — global RTK Query topology (base instance, mutex refresh).
- [`../../server/docs/scenes.md`](../../server/docs/scenes.md) — backend module: schema, mappers, plan limits, file storage.
