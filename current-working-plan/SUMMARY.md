# MeshHub — Current Working Plan

## Overview

This plan covers the product roadmap from foundation to full platform. Each iteration builds on the previous and produces a deployable increment.

---

## Iteration Summary

| # | Name | Status | Key Deliverable |
|---|---|---|---|
| [ITER-1](ITER-1.md) | Foundation: DB + Personal Scenes & Models | ✅ Done | Personal scope for models/scenes, `visibility` field, personal routes |
| [ITER-2](ITER-2.md) | Scene Editor: Complete UI | ✅ Done | Objects/Lights/Config panels, real-time canvas, scene state sync |
| [ITER-3](ITER-3.md) | Model Editor: Lights, Display Config & Post-Processing | ✅ Done | Custom lighting, renderer settings, EffectComposer pipeline, display presets |
| [ITER-4](ITER-4.md) | Model Editor: Materials & Textures | ✅ Done | Per-mesh material overrides, PBR sliders, texture uploads |
| [ITER-5](ITER-5.md) | Animations Enhanced + Audio | ✅ Done | Speed/loop/crossfade in AnimationToolbar, scene object animations, Three.js audio |
| [ITER-6](ITER-6.md) | Multi-Format Support | ✅ Done | FBX / OBJ+MTL / DAE / STL loader registry, `original_format` column, format badge, upload progress |
| [ITER-7](ITER-7.md) | Review & Annotations: Scenes + Access Control | ✅ Done | Scene annotations/comments, `@OptionalUser` access control, public scene page |
| [ITER-8](ITER-8.md) | Discovery & UX Polish | ✅ Done | Search, DnD upload, presets menu, measure tool, screenshot, scene clone |
| [ITER-9](ITER-9.md) | Embed & Integrations | 🔲 Pending | Scene embed, in-app notifications, webhooks, API key scopes |
| [ITER-10](ITER-10.md) | Migration Consolidation | 🔲 Pending | All migrations collapsed into one `InitAll` file before first deploy |

---

## Architecture Overview

```
PostgreSQL 18
├── auth.session
├── users.user / user_meta / role
├── model_3d.model_3d / model_3d_file / model_version
│   ├── model_material_override    ← ITER-4
│   ├── model_audio                ← ITER-5
│   └── model_annotation / model_comment (existing)
├── scenes.scene / scene_object / scene_light
│   ├── scene_annotation           ← ITER-7
│   └── scene_comment              ← ITER-7
├── organizations.organization / org_member / org_subscription
│   └── webhook / webhook_delivery_log  ← ITER-9
├── embed.api_key / embed_project
│   └── scene_id FK on embed_project   ← ITER-9
├── notifications.notification         ← ITER-9
└── workspaces.workspace / workspace_member
```

---

## Three.js Class Stack

```
Viewer
├── CameraController   — orbit, fly, FPS camera modes
├── Renderer           — WebGLRenderer + EffectComposer (ITER-3)
│   ├── SSAOPass       ← ITER-3
│   ├── UnrealBloomPass← ITER-3
│   ├── BokehPass      ← ITER-3
│   └── ColorCorrectionShader ← ITER-3
├── World              — scene graph, lights, HDRI
├── Loader             — format registry (ITER-6)
│   ├── GLTFLoader     (existing)
│   ├── FBXLoader      ← ITER-6
│   ├── OBJLoader+MTL  ← ITER-6
│   ├── ColladaLoader  ← ITER-6
│   └── STLLoader      ← ITER-6
├── MeasureTool        ← ITER-8
└── Audio              ← ITER-5 (THREE.AudioListener on camera)
```

---

## Display Presets (defined in ITER-3, exposed in ITER-8)

| Preset | Tone Mapping | Bloom | SSAO | DOF | Notes |
|---|---|---|---|---|---|
| Neutral | Reinhard | off | off | off | Raw, no effect |
| Eevee | ACESFilmic | thresh 0.9 | radius 16 | off | Blender Eevee look |
| Unreal Engine | ACESFilmic | thresh 0.8 | radius 32 | weak | UE5 defaults |
| Unity HDRP | ACESFilmic | thresh 0.85 | radius 24 | off | Unity HDRP profile |
| Product Render | Linear | off | radius 16 | off | Clean studio look |
| Studio | Linear | off | off | off | Neutral, no PP |

---

## Key Constraints (never break)

- `TypeORM synchronize: false` — migrations only
- Single RTK Query `createApi` instance — `Api.injectEndpoints` only
- FSD import direction: `app → pages → widgets → entities → shared`
- No JWT in headers — HttpOnly cookies only
- All entities use soft-delete via base class `deletedAt`
- No `process.env` in feature code — use `ConfigService`

---

## ITER-1 SUMMARY

**Status:** ✅ Completed

**Scope:** Personal (user-owned) scenes alongside existing workspace-scoped scenes.

### What was implemented

**Backend (NestJS / TypeORM)**

| File | Change |
|---|---|
| `migrations/scenes/1777400000000-AddPersonalScenes.ts` | New migration: adds `scene_visibility` enum; makes `workspace_id` nullable; adds `user_id` UUID FK to `users.user`; adds `visibility` column (default `private`); adds `CHK_scene_owner` CHECK constraint |
| `database/entities/scenes/scene.entity.ts` | `workspaceId`/`workspace` relation made nullable; added `userId: string \| null`, `user: UserEntity \| null`, `visibility: SceneVisibility`; exported `SceneVisibility` type |
| `modules/scenes/dto/scene.create.request.dto.ts` | `workspaceId` now `@IsOptional()` |
| `modules/scenes/dto/scene.update.request.dto.ts` | Added optional `visibility` field with `@IsEnum` |
| `modules/scenes/dto/scene.response.dto.ts` | `SceneResponseDto`: added `userId`, `visibility`, changed `workspaceId` to nullable; `SceneListItemResponseDto`: same plus `updatedAt` |
| `modules/scenes/repositories/scene.repository.ts` | Added `findByUserId(userId)` method |
| `modules/scenes/services/scenes.service.ts` | Full auth refactor: `requireSceneReadAccess` / `requireSceneWriteAccess` helpers; `createScene` branches on workspaceId vs personal; `listScenes` accepts `{ workspaceId?, userId? }`; `deleteScene` guards `resolveOrgId` for personal scenes; `getPlanLimitsForScene` returns Starter limits for personal scenes; all write methods use new helpers |
| `modules/scenes/controllers/scenes.controller.ts` | `listScenes` handler: removed `ParseUUIDPipe` from `workspaceId`; made optional; added `userId` query param |
| `modules/scenes/mappers/scene.mapper.ts` | `toResponse` and `toListItemResponse` map `userId`, `visibility`, `updatedAt` |

**Frontend (React / RTK Query)**

| File | Change |
|---|---|
| `app/api/dto.ts` | Added `SceneVisibility` const + `SceneVisibilityType` type; updated `SceneResponseDto`, `SceneListItemResponseDto` (nullable `workspaceId`, added `userId`/`visibility`/`updatedAt`); `SceneCreateRequestDto.workspaceId` optional; added `visibility` to `SceneUpdateRequestDto` |
| `app/api/scenes.ts` | `scenes` query accepts `{ workspaceId?, userId? }`; `createScene` tag uses `workspaceId ?? 'personal'`; `deleteScene` arg `workspaceId` optional |
| `shared/router/paths.ts` | Added `UserScenes: 'scenes'` |
| `app/router/index.tsx` | Added `/user/scenes` and `/user/scenes/:sceneId` lazy routes |
| `widgets/UserSidebar/index.tsx` | Added **Сцены** nav link with `IconMovie` between Модели and Профиль |
| `pages/Scenes/CreateSceneModal.tsx` | `workspaceId` prop made optional; submission builds payload conditionally |
| `pages/UserScenes/index.tsx` | New barrel re-export |
| `pages/UserScenes/UserScenesPage.tsx` | New page: lists personal scenes via `useScenesQuery({ userId: 'me' })`; loading skeletons; empty state with `EmptyData` widget + CTA button; scene grid with cards showing thumbnail, visibility badge, object count, relative time; 3-dot menu for open/visibility change/delete; `CreateSceneModal` without workspaceId |

### Design decisions made

1. **EmptyData `action` prop not added** — CTA button rendered separately below the widget to avoid widget API change.
2. **`SceneListItemResponseDto.updatedAt`** — added as nullable `Date | null` since `GuidIdEntityBase.updatedAt` can be null before first update.
3. **Personal scenes use Starter plan limits** — `getPlanLimitsForScene` returns `SCENE_LIMITS[PlanType.Starter]` when `workspaceId` is null.
4. **`resolveOrgId` not called for personal scenes** — file cleanup and HDRI storage skip org resolution when `workspaceId` is null; S3 strategy is workspace/org-scoped so personal scene files go to local storage only.

---

## ITER-2 SUMMARY

**Status:** ✅ Completed

**Scope:** Complete Scene Editor UI — Objects/Lights/Config tabs in the navbar, AddModelToSceneModal, light management with inline edit forms, scene config panel (background, ambient, HDRI, fog local state), and unified SelectionState driving the Properties aside panel.

### What was implemented

**Three.js / World class**

| File | Change |
|---|---|
| `widgets/Model3DViewer/classes/World/World.ts` | Added `setBackgroundColor(hex)` — sets `scene.background` to a Three.js `Color`; added `syncLights(lights)` — diffs scene lights against DTO array by `userData.lightId`, removes stale, updates existing, adds new |

**Scene Viewer Hook**

| File | Change |
|---|---|
| `pages/SceneEditor/hooks/model.ts` | New file — exports `SelectionState` union type (`{ type: 'object'; id: string } \| { type: 'light'; id: string } \| null`) |
| `pages/SceneEditor/hooks/useSceneViewer.ts` | Replaced `selectedObjectId` with `selectionState: SelectionState`; added `selectLight`, `updateBackgroundColor`, `updateAmbientLight`, `loadHdri`, `syncLights` callbacks |

**RTK Query**

| File | Change |
|---|---|
| `app/api/models-3d.ts` | Added `Models3DQueryParams` type with optional `workspaceId`; `models3D` query now uses it to pass `workspaceId` as query param |

**Scene Navbar (tab panel)**

| File | Change |
|---|---|
| `pages/SceneEditor/components/Navbar/constants.ts` | `SceneTabValues` const object + `SceneTabValue` type |
| `pages/SceneEditor/components/Navbar/model.ts` | `SceneTabsConfig` interface |
| `pages/SceneEditor/components/Navbar/SceneNavbar.module.scss` | Icon-only tab sidebar styles (mirrors `Editor/Navbar` pattern) |
| `pages/SceneEditor/components/Navbar/utils.tsx` | `getSceneTabsConfig()` factory — returns 3 tab configs wiring panels to callbacks |
| `pages/SceneEditor/components/Navbar/SceneNavbar.tsx` | `<SceneNavbar>` — AppShell.Navbar with icon-only Tabs; auto-switches to Lights tab on light selection |

**Panels**

| File | Change |
|---|---|
| `pages/SceneEditor/panels/AddModelToSceneModal.tsx` | New — modal with search TextInput; combines `useCurrentUser3DModelsQuery` + optional `useModels3DQuery(workspaceId)`; `SimpleGrid` model cards with thumbnail; Skeleton ×6 loading; `EmptyData` empty state; `useAddSceneObjectMutation` on card click |
| `pages/SceneEditor/panels/SceneObjectsPanel.tsx` | Added `ActionIcon IconPlus` header button → opens `AddModelToSceneModal`; delete now uses `modals.openConfirmModal()`; `EmptyData` widget when list is empty |
| `pages/SceneEditor/panels/SceneLightsPanel.tsx` | New — light list with color dot + type icon + intensity badge + hover edit/delete; inline `LightForm` for add and edit (`Collapse` animated); `modals.openConfirmModal()` for delete; `syncLights` called after all mutations; `EmptyData` when empty |
| `pages/SceneEditor/panels/SceneConfigPanel.tsx` | New — Background `ColorInput` (debounced → save + live preview); Ambient `NumberInputSlider` (debounced → save + live preview); HDRI `Dropzone` (.hdr, 20 MB) with `useUploadSceneHdriMutation` + `loadHdri`; remove HDRI button; Fog section (local state only, DB persistence in ITER-3) |
| `pages/SceneEditor/panels/ScenePropertiesPanel.tsx` | Upgraded to accept `selectionState: SelectionState` + `syncLights`; 3-branch render: object → `ObjectTransformPanel`, light → inline `LightPropertiesPanel` (debounced `updateSceneLight` + `syncLights`), null → `SceneInfoCard` (name, visibility badge, object/light counts, last saved) |

**Page Integration**

| File | Change |
|---|---|
| `pages/SceneEditor/SceneEditorPage.tsx` | Replaced `SceneObjectsPanel` + `AppShell.Navbar` with `<SceneNavbar>`; destructures all new hook returns; aside `collapsed` now driven by `!selectionState`; `ScenePropertiesPanel` receives `selectionState` + `syncLights` |

### Design decisions made

1. **Fog is local state only** — DB column and persistence deferred to ITER-3 as specified; a disabled "Apply" button with label makes this explicit in the UI.
2. **HDRI serve URL** — constructed as `/api/scenes/{id}/hdri` since `uploadSceneHdri` returns `void` (no URL in response); matches the backend static file serve pattern.
3. **`syncLights` deduplication** — `SceneLightsPanel` passes `result.lights` from mutation response directly to `syncLights`; `ScenePropertiesPanel` also calls `syncLights` after `updateSceneLight` to keep Three.js in sync without needing a re-query.
4. **Tab auto-switch** — `SceneNavbar` uses a `useEffect` to switch to the Lights tab whenever `selectionState.type === 'light'`, ensuring the user sees the light list after clicking a light in the canvas.
5. **Dual-source model list** — `AddModelToSceneModal` merges `currentUser3DModels` and `workspaceModels` (when `scene.workspaceId` is set) by deduplicating on `model.id`, so the user sees all accessible models in one grid.

---

## ITER-3 SUMMARY

**Status:** ✅ Completed

**Scope:** Model Editor — custom lighting per model, display configuration (background, ambient, fog, renderer settings), EffectComposer post-processing pipeline, and display presets.

### What was implemented

**Database (Phase 1)**

| File | Change |
|---|---|
| `server/src/database/constants.ts` | Added `ModelDisplayConfig` and `ModelLight` to `Models3DSchemaTables` |
| `server/src/database/entities/models-3d/model-display-config.entity.ts` | New entity — 1:1 with `model_3d`; stores background color, ambient intensity, HDRI path, fog settings, postProcess JSON, rendererConfig JSON |
| `server/src/database/entities/models-3d/model-light.entity.ts` | New entity — M:1 with `model_3d`; stores type (directional/point/spot), position, color, intensity, castShadow |
| `server/src/database/migrations/models-3d/1777402000000-AddModelDisplayConfig.ts` | Migration: creates `model_display_config` and `model_light` tables |

**File Storage (Phase 2)**

| File | Change |
|---|---|
| `server/src/modules/files/types.ts` | Added `saveModelDisplayHdri` and `deleteModelDisplayHdri` to `IFileStorageStrategy` |
| `server/src/modules/files/strategies/fs.files.strategy.ts` | Implemented HDRI save/delete for local filesystem |
| `server/src/modules/files/strategies/s3.files.strategy.ts` | Implemented HDRI save/delete for S3 |
| `server/src/modules/files/files.service.ts` | Added `saveModelDisplayHdri`, `deleteModelDisplayHdri`, `getModelDisplayHdriUrl` |

**Backend display-config submodule (Phase 2)**

| File | Change |
|---|---|
| `server/src/modules/models-3d/display-config/dto/display-config.response.dto.ts` | Response DTO with nested `ModelLightResponseDto` array |
| `server/src/modules/models-3d/display-config/dto/display-config.update.dto.ts` | Partial update DTO for display config fields |
| `server/src/modules/models-3d/display-config/dto/model-light.upsert.dto.ts` | Upsert + update DTOs for model lights |
| `server/src/modules/models-3d/display-config/repositories/display-config.repository.ts` | TypeORM repository wrapper |
| `server/src/modules/models-3d/display-config/repositories/model-light.repository.ts` | TypeORM repository wrapper |
| `server/src/modules/models-3d/display-config/display-config.service.ts` | Business logic: get/update config (upsert), upload/remove HDRI, add/update/remove lights |
| `server/src/modules/models-3d/display-config/display-config.controller.ts` | REST controller — prefix `models-3d/:modelId/display-config`; 7 endpoints |
| `server/src/modules/models-3d/display-config/display-config.module.ts` | Feature module |
| `server/src/modules/models-3d/models-3d.module.ts` | Added `DisplayConfigModule` import |

**Three.js / Renderer (Phase 3)**

| File | Change |
|---|---|
| `client/src/widgets/Model3DViewer/classes/types/renderer.ts` | Added `PostProcessConfig` and `FogConfig` interfaces |
| `client/src/widgets/Model3DViewer/classes/World/World.ts` | Added `setFog(config: FogConfig)` — creates `Fog` or `FogExp2` on the scene |
| `client/src/widgets/Model3DViewer/classes/Renderer/Renderer.ts` | Full rewrite to use `EffectComposer` pipeline; `RenderPass` + `OutputPass` always active; `setPostProcessing(config)` dynamically adds/removes SSAOPass, UnrealBloomPass, BokehPass, VignetteShader, ColorCorrectionShader passes |
| `client/src/widgets/Model3DViewer/constants/displayPresets.ts` | 6 display presets (Studio, Outdoor, Dark, Cinematic, Minimal, Product) with full config snapshots |

**Frontend API layer (Phase 4)**

| File | Change |
|---|---|
| `client/src/app/api/dto.ts` | Added `ModelLightType`, `ModelLightTypeValue`, `ModelLightResponseDto`, `DisplayConfigResponseDto`, `DisplayConfigUpdateDto`, `ModelLightUpsertDto`, `ModelLightUpdateDto` |
| `client/src/app/api/tags.ts` | Added `DisplayConfig: 'DisplayConfig'` to `ApiTags` |
| `client/src/app/api/display-config.ts` | 7 RTK Query endpoints: `getDisplayConfig`, `updateDisplayConfig`, `uploadDisplayHdri`, `removeDisplayHdri`, `addModelLight`, `updateModelLight`, `removeModelLight` |

**Editor UI (Phases 5–6)**

| File | Change |
|---|---|
| `client/src/pages/Editor/components/Navbar/constants.ts` | `Renderer: 'renderer'` → `DisplayConfig: 'display-config'` |
| `client/src/pages/Editor/components/Navbar/model.ts` | `TabValue` updated to include `'display-config'` |
| `client/src/pages/Editor/components/Navbar/utils.tsx` | Removed RendererTab; wires DisplayConfigTab and LightsTab |
| `client/src/pages/Editor/components/Navbar/components/DisplayConfigTab/index.tsx` | New tab: 5 collapsible sections — Presets, Environment (bg color, ambient, HDRI), Fog (type, color, near/far/density), Post-Processing (Bloom, Vignette, SSAO with Collapse sliders), Renderer settings; applies changes live to viewer; Save button persists to backend |
| `client/src/pages/Editor/components/Navbar/components/LightsTab/index.tsx` | New tab: add / edit / delete model lights (directional, point, spot); inline LightForm with type, color, intensity, position, castShadow; syncs Three.js scene on every mutation |
| `client/src/pages/Editor/components/Navbar/components/RendererTab/` | **Deleted** — replaced by DisplayConfigTab |

**Apply config on load (Phase 7)**

| File | Change |
|---|---|
| `client/src/widgets/Model3DViewer/hooks/useViewer.ts` | Added `displayConfig?: DisplayConfigResponseDto \| null` to `UseViewerProps`; after `world.prepare()`, applies background, ambient, fog, lights, rendererConfig, postProcess to the viewer |
| `client/src/widgets/Model3DViewer/index.tsx` | `Model3DPageViewerProps` now includes `displayConfig` (passed through to `useViewer`) |
| `client/src/pages/Editor/components/Main/index.tsx` | Added `displayConfig?: DisplayConfigResponseDto \| null` prop, passed to `<Model3DViewer>` |
| `client/src/pages/Editor/index.tsx` | Fetches `useGetDisplayConfigQuery` and passes result to `<Main displayConfig={displayConfig}>` |

### REST API surface added

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/models-3d/:modelId/display-config` | JWT | Get full config + lights |
| PATCH | `/api/models-3d/:modelId/display-config` | JWT + owner | Update display config fields |
| POST | `/api/models-3d/:modelId/display-config/hdri` | JWT + owner | Upload HDRI environment map |
| DELETE | `/api/models-3d/:modelId/display-config/hdri` | JWT + owner | Remove HDRI |
| POST | `/api/models-3d/:modelId/display-config/lights` | JWT + owner | Add a light |
| PATCH | `/api/models-3d/:modelId/display-config/lights/:lightId` | JWT + owner | Update a light |
| DELETE | `/api/models-3d/:modelId/display-config/lights/:lightId` | JWT + owner | Delete a light |

### Design decisions made

1. **RendererTab replaced** — `DisplayConfigTab` absorbs all previous renderer settings and adds Environment, Fog, and Post-Processing sections. A single consolidated tab reduces UI surface.
2. **EffectComposer always active** — Even without post-processing enabled, the render path uses `EffectComposer` → `RenderPass` → `OutputPass`, ensuring color-space correct output and zero cost when effects are off.
3. **Post-processing passes dynamically imported** — `setPostProcessing()` uses dynamic `import()` to load SSAOPass, BokehPass, etc. only when needed, keeping the initial bundle lean.
4. **displayConfig is optional prop** — `useViewer` applies config only when the prop is non-null; the public model page and embed viewer remain unaffected since they don't pass it.
5. **Lights use `syncLights` which accepts `SceneLightResponseDto[]`** — `ModelLightResponseDto` is structurally identical; cast as `any` in the tabs to avoid a coupling between schemas.
6. **HDRI served at `/api/models-3d/:modelId/display-config/hdri`** — consistent with the scene HDRI pattern at `/api/scenes/:id/hdri`.

---

## ITER-4 SUMMARY

**Status:** ✅ Completed

**Scope:** Model Editor — per-mesh PBR material overrides with color, metalness, roughness, emissive, opacity, wireframe controls, and 6 texture map upload slots (map, normal, roughness, metalness, emissive, ao).

---

## ITER-5 SUMMARY

**Status:** ✅ Completed

**Scope:** Animations Enhanced + Audio — improved animation player controls in the model viewer, scene-level animation management, full-stack audio support for 3D models (upload/stream/playback), and audio configuration per scene object.

### What was implemented

**Backend (NestJS / TypeORM)**

| File | Change |
|---|---|
| `database/entities/model_3d/model-audio.entity.ts` | New entity: `model_audio` table with UUID PK, `modelId` FK, `filename`, `originalName`, `mimeType`, `sizeBytes`, `durationS` nullable |
| `database/entities/scenes/scene-object.entity.ts` | Added `animationConfig` and `audioConfig` JSONB columns (nullable `Record<string, unknown>`) |
| `migrations/model_3d/1777500000000-AddModelAudio.ts` | Creates `model_audio` table |
| `migrations/scenes/1777501000000-AddSceneObjectAnimationAndAudioConfig.ts` | Adds `animation_config` and `audio_config` JSONB columns to `scene_object` |
| `modules/models-3d/audio/` | New submodule: `AudioModule`, `AudioController`, `AudioService`, `AudioRepository`, `ModelAudioMapper`; endpoints: `GET /models-3d/:modelId/audio`, `POST` (upload), `DELETE :audioId`, `GET :audioId/stream` (StreamableFile for local FS, redirect for S3) |
| `modules/scenes/dto/scene.request.dto.ts` | Added `AnimationConfigDto`, `SceneObjectAudioConfigDto`; `SceneObjectUpsertDto` accepts optional `animationConfig`/`audioConfig` |
| `modules/scenes/dto/scene.response.dto.ts` | `SceneObjectResponseDto` includes `animationConfig?` and `audioConfig?` nullable; `SceneVisibility`/`SceneConfig` changed to `import type` to satisfy TS1272 |
| `modules/scenes/services/scenes.service.ts` | `updateObject` maps `animationConfig`/`audioConfig` with cast to `Record<string, unknown>` |
| `modules/scenes/mappers/scene.mapper.ts` | Maps `animationConfig` and `audioConfig` to response |

**Frontend (React / RTK Query)**

| File | Change |
|---|---|
| `app/api/dto.ts` | Added `ModelAudioResponseDto`, `SceneObjectAudioConfigDto`; extended `SceneObjectUpsertDto` with `audioConfig`/`animationConfig`; `SceneObjectResponseDto` includes optional config fields |
| `app/api/audio.ts` | New — `AudioApi` with `listModelAudio`, `uploadModelAudio`, `deleteModelAudio`; exports three hooks |
| `widgets/Model3DViewer/classes/Viewer/Viewer.ts` | Added `AudioListener`, `AudioLoader`, `Audio` (ThreeAudio) support; `playAudio(url, opts)`, `stopAllAudio()`, `audioContext` getter |
| `widgets/Model3DViewer/index.tsx` | Shows suspended-AudioContext overlay + resume button; passes `modelId` + `viewer` to `Model3DViewerBottomBar` |
| `widgets/Model3DViewer/components/Model3DViewerBottomBar/index.tsx` | Accepts `modelId?` + `viewer?` props; renders `<AudioToolbar>` when `modelId` is set |
| `widgets/Model3DViewer/components/Model3DViewerBottomBar/components/AudioToolbar/index.tsx` | New — track Select, play/stop, loop toggle, volume Slider, mute ActionIcon |
| `pages/Editor/components/Navbar/model.ts` | `TabValue` union includes `'audio'` |
| `pages/Editor/components/Navbar/constants.ts` | `TabValues.Audio = 'audio'` |
| `pages/Editor/components/Navbar/utils.tsx` | Audio tab entry with `IconVolume` |
| `pages/Editor/components/Navbar/components/AudioTab/index.tsx` | New — lists/uploads/deletes model audio tracks |
| `pages/SceneEditor/panels/SceneAnimationsPanel.tsx` | Added `ObjectAudioConfig` sub-component: track Select, volume, loop/autoplay/positional switches, maxDistance; patches scene object via `useUpdateSceneObjectMutation` |
| `pages/SceneEditor/hooks/useSceneViewer.ts` | After scene loads, auto-plays audio for objects with `audioConfig.autoplay === true` |

### Design decisions made

1. **Audio stream uses `@Redirect()`** — for S3 storage, returns `{ url, statusCode: 302 }` which NestJS handles; for local FS returns a `StreamableFile`. Avoids proxying large audio through the API server.
2. **`AudioModule` provides `FilesService` directly** — `FileStorageModule` is `@Global()`, so providing `FilesService` in `AudioModule.providers` avoids a module import circular dependency.
3. **AudioContext unblock overlay** — browsers suspend `AudioContext` until user gesture; viewer shows an overlay with "Click to enable audio" when context is suspended and tracks are present.
4. **Per-scene-object audio config stored as JSONB** — typed as `SceneObjectAudioConfigDto` on the client via interface cast; flexible schema avoids a schema migration each time a new config field is added.
5. **Autoplay fires after `loadScene()` resolves** — gives Three.js time to set up the scene graph before audio playback starts.

### What was implemented

**Database (Phase 1)**

| File | Change |
|---|---|
| `server/src/database/constants.ts` | Added `ModelMaterialOverride: 'model_material_override'` to `Models3DSchemaTables` |
| `server/src/database/entities/models-3d/model-material-override.entity.ts` | New entity — M:1 with `model_3d`; stores `meshName`, PBR floats, hex colors, `wireframe`, 6 texture path columns; unique constraint on `(modelId, meshName)` |
| `server/src/database/migrations/models-3d/1777404000000-AddModelMaterialOverride.ts` | Migration: creates `model_material_override` table with all columns, FK to `model_3d` with CASCADE delete, index on `model_id` |

**File Storage (Phase 2)**

| File | Change |
|---|---|
| `server/src/modules/files/types.ts` | Added `saveModelMaterialTexture` and `deleteModelMaterialTexture` to `IFileStorageStrategy` |
| `server/src/modules/files/strategies/fs.files.strategy.ts` | Local strategy: saves to `files/models-3d/{modelId}/materials/{overrideId}/`; delete tries all 4 extensions with `force: true` |
| `server/src/modules/files/strategies/s3.files.strategy.ts` | S3 strategy: key `models-3d/{modelId}/materials/{overrideId}/{type}{ext}`; silent delete of all 4 extensions |
| `server/src/modules/files/files.service.ts` | Added `saveModelMaterialTexture` and `deleteModelMaterialTexture` org-aware methods |

**Backend materials submodule (Phase 3)**

| File | Change |
|---|---|
| `server/src/modules/models-3d/materials/dto/material-override.response.dto.ts` | Response DTO — all PBR fields + 6 `*Url` fields for texture serving URLs |
| `server/src/modules/models-3d/materials/dto/material-override.upsert.dto.ts` | Upsert DTO — all PBR fields optional; `@IsHexColor`, `@IsNumber @Min @Max`, `@IsBoolean` validators |
| `server/src/modules/models-3d/materials/material-override.repository.ts` | TypeORM repository wrapper with `findByModelId`, `findByModelAndMesh`, `save`, `softDelete` |
| `server/src/modules/models-3d/materials/materials.service.ts` | Business logic: `listMaterials`, `upsertMaterial`, `deleteMaterial`, `uploadTexture`, `clearTexture`, `getOverrideForTexture` |
| `server/src/modules/models-3d/materials/materials.controller.ts` | REST controller — prefix `models-3d/:modelId/materials`; 6 endpoints; `GET /:meshName/texture/:type` streams file with `StreamableFile` |
| `server/src/modules/models-3d/materials/materials.module.ts` | Feature module |
| `server/src/modules/models-3d/models-3d.module.ts` | Added `MaterialsModule` import |

**Frontend API layer (Phase 4)**

| File | Change |
|---|---|
| `client/src/app/api/dto.ts` | Added `MaterialOverrideResponseDto` and `MaterialOverrideUpsertDto` |
| `client/src/app/api/tags.ts` | Added `Materials: 'Materials'` to `ApiTags` |
| `client/src/app/api/materials.ts` | 5 RTK Query endpoints: `getMaterials`, `upsertMaterial`, `deleteMaterial`, `uploadMaterialTexture`, `deleteMaterialTexture` |

**Three.js (Phase 5)**

| File | Change |
|---|---|
| `client/src/widgets/Model3DViewer/classes/World/World.ts` | Added `applyMaterialOverrides(overrides: MaterialOverrideResponseDto[])` — traverses scene, matches by `mesh.name`, clones material, applies PBR values, loads textures via `TextureLoader` |
| `client/src/widgets/Model3DViewer/hooks/useViewer.ts` | Added `materialOverrides?: MaterialOverrideResponseDto[] | null` to `UseViewerProps`; applies after `displayConfig` in model-load effect |

**Editor UI (Phase 6)**

| File | Change |
|---|---|
| `client/src/pages/Editor/components/Navbar/model.ts` | Added `'materials'` to `TabValue` type |
| `client/src/pages/Editor/components/Navbar/constants.ts` | Added `Materials: 'materials'` to `TabValues` |
| `client/src/pages/Editor/components/Navbar/utils.tsx` | Added `MaterialsTab` entry with `IconPalette` to `getTabsConfig()` |
| `client/src/pages/Editor/components/Navbar/components/MaterialsTab/index.tsx` | New tab: mesh list from scene traverse with WorldSceneChange listener; per-mesh `Collapse` form with all PBR fields; 6 texture slots with `FileButton` upload and `ActionIcon` delete; Save/Reset buttons |

**Integration (Phase 7)**

| File | Change |
|---|---|
| `client/src/pages/Editor/index.tsx` | Fetches `useGetMaterialsQuery`; passes `materialOverrides` to `<Main>` |
| `client/src/pages/Editor/components/Main/index.tsx` | Added `materialOverrides?` prop; passes to `<Model3DViewer>` |
| `client/src/pages/Models3D/pages/Model3D/index.tsx` | Fetches `useGetMaterialsQuery`; passes `materialOverrides` to `<Model3DViewer>` |

### REST API surface added

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/models-3d/:modelId/materials` | Public | List all material overrides |
| PUT | `/api/models-3d/:modelId/materials/:meshName` | JWT + owner | Upsert PBR values for a mesh |
| DELETE | `/api/models-3d/:modelId/materials/:meshName` | JWT + owner | Delete override + all textures |
| POST | `/api/models-3d/:modelId/materials/:meshName/texture/:type` | JWT + owner | Upload texture file |
| DELETE | `/api/models-3d/:modelId/materials/:meshName/texture/:type` | JWT + owner | Remove texture file |
| GET | `/api/models-3d/:modelId/materials/:meshName/texture/:type` | Public | Stream texture binary |

### Design decisions made

1. **Upsert-by-meshName** — the controller uses `PUT /:meshName` for idempotent creation/update; the unique constraint `(modelId, meshName)` in the DB enforces one override per mesh. This avoids a separate "create vs update" flow in the UI.
2. **Texture serving via StreamableFile** — textures for local storage are streamed directly from disk by NestJS; S3 URLs are returned in the response DTO as pre-signed links (inherited from `FilesService.getModelMaterialTextureUrl`).
3. **Stored path is cwd-relative** — texture paths stored as `models-3d/{modelId}/materials/{overrideId}/{type}{ext}`; the controller prepends `files/` to resolve the absolute path, matching the `fsConfig.folders.models` layout.
4. **Material clone in Three.js** — `applyMaterialOverrides` always clones the original material before mutating it, preventing shared-material side effects across mesh instances.
5. **Texture URLs in response DTO** — `toResponse()` in the service constructs URL strings using the `/api/models-3d/:modelId/materials/:meshName/texture/:type` pattern so the frontend can load them directly as `TextureLoader` URLs.

---

## ITER-6 SUMMARY

**Status:** ✅ Completed

**Scope:** Multi-format 3D model support — FBX, OBJ+MTL, DAE (Collada), STL alongside existing GLB/GLTF. Browser-side loading via Three.js loader registry, no server-side conversion. Includes format-aware server validation, `original_format` persistence, format badge UI, OBJ-as-zip tip, and an XHR-based upload progress bar.

### What was implemented

**Backend (NestJS / TypeORM)**

| File | Change |
|---|---|
| `constants/files.ts` | Added `DEFAULT_MAX_3D_MODEL_FILE_SIZE` and `MODEL_MAX_SIZE_BYTES` per-extension map (3 GB for `.glb/.gltf/.fbx/.zip`, 1 GB for `.dae`, 500 MB for `.obj/.stl`, 10 MB for `.mtl`); expanded `ACCEPTED_3D_MODEL_FILE_TYPES` to include `.fbx/.obj/.dae/.stl` (no `.mtl` at controller level — only valid inside zip) |
| `pipes/file-size-validator.pipe.ts` | `FileSizeValidator` constructor accepts `number \| Record<string, number>` plus optional `defaultSizeBytes`; `isValid` derives extension from `file.originalname` and looks up the per-format limit; `buildErrorMessage` reports the applied limit |
| `database/migrations/models-3d/1777600000000-AddModelOriginalFormat.ts` | New migration: `ALTER TABLE model_3d.model_3d_file ADD COLUMN original_format varchar(10) NOT NULL DEFAULT 'glb'` |
| `database/entities/models-3d/model-3d-file.entity.ts` | Added `originalFormat: string` column |
| `modules/files/types.ts` | `ExtractedFile` gains `size: number`; `IFileStorageStrategy.save3DModelDirectory` and `saveModelVersionDirectory` now `Promise<void>` |
| `modules/files/strategies/fs.files.strategy.ts`, `s3.files.strategy.ts` | Removed inline entry-file regex pick; strategies are now storage-only |
| `modules/files/files.service.ts` | Expanded `ALLOWED_EXTENSIONS` zip allowlist with `.obj/.mtl/.dae/.fbx/.stl/.tga/.bmp/.tif/.tiff`; new private helper `selectEntryFile(files)` enforces per-format rules (mixed-format rejection, gltf/glb mutual exclusion, exactly-one for fbx/dae/stl, largest-wins with lexicographic tiebreak for OBJ); both `extractAndSave3DModelDirectory` and `extractAndSaveModelVersionDirectory` now return `{ entryFile, format }` |
| `modules/models-3d/controllers/model-3d.controller.ts`, `versions/versions.controller.ts` | Wired `MODEL_MAX_SIZE_BYTES` + `DEFAULT_MAX_3D_MODEL_FILE_SIZE` into `FileSizeValidator` on both upload endpoints |
| `modules/models-3d/services/model-3d.service.ts` | `upload3DModel` writes `originalFormat` in both branches: non-zip uses `extname(file.originalname).slice(1).toLowerCase()`, zip uses the format returned by `extractAndSave3DModelDirectory` |
| `modules/models-3d/versions/versions.service.ts` | Destructures new `{ entryFile }` shape from `extractAndSaveModelVersionDirectory` |
| `modules/models-3d/dto/model-3d-file.response.dto.ts`, `mappers/model-3d-file.mapper.ts` | Added `originalFormat` to response shape |

**Frontend Loader (Three.js)**

| File | Change |
|---|---|
| `widgets/Model3DViewer/classes/types/viewer.ts` | `LoadedModel3D.scene` widened from `Group` to `Object3D` (Collada compatibility) |
| `widgets/Model3DViewer/classes/Loader/Loader.ts` | Replaced single-format GLTF loader with extension-based dispatch; added private `loadGltf`, `loadFbx`, `loadObj`, `loadDae`, `loadStl` methods; OBJ uses `MTLLoader.setResourcePath(baseUrl)` with graceful fallback to OBJ-only on MTL fetch failure; FBX/DAE/STL apply default `MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.8 })` to materialless meshes via traverse; `LoaderCache` semantics preserved |

**Frontend Upload UI (React / RTK Query)**

| File | Change |
|---|---|
| `shared/constants/files.ts` | Mirrored server: expanded `ACCEPTED_3D_MODEL_FILE_TYPES` to 7 formats; added `MAX_3D_MODEL_FILE_SIZES` per-format map |
| `shared/api/uploadModel3DWithProgress.ts` | New pure-I/O XHR helper with `withCredentials = true` (matches `credentials: 'include'` baseQuery); reports progress via callback; resolves with `{ modelId }` |
| `widgets/Upload3DModelModal/index.tsx` | Updated dropzone `accept` list and Russian help text; added Mantine `<Progress>` bar shown when `selectedFile.size > 10 MB && 0 < uploadProgress < 100`; added conditional OBJ-tip `<Alert>` when `selectedFile?.name.endsWith('.obj')` |
| `widgets/Upload3DModelModal/useUpload3DModal.ts` | Replaced RTK mutation with `uploadModel3DWithProgress`; tracks `uploadProgress` state; on success dispatches `Api.util.invalidateTags([CurrentUser3DModels, Get3DModels])`; resets state on close |
| `widgets/Models3DList/components/Model3DCard/index.tsx` + `constants.ts` | Added `FORMAT_COLOR` map and Mantine `<Badge>` next to model name (blue/orange/grape/teal/gray) when `originalFormat` is present |
| `app/api/models-3d.ts` | Removed now-unused `upload3DModel` RTK mutation and `useUpload3DModelMutation` export (replaced by the XHR helper) |

**Frontend DTO sync**

| File | Change |
|---|---|
| `app/api/dto.ts` | Added `originalFormat?: string` to `Model3DFileResponseDto` (optional during rollout) |

### Design decisions made

1. **Entry-file selection lifted into `FilesService`** — both `FsFileStorageStrategy` and `S3FileStorageStrategy` independently re-picked the GLTF entry file via regex; that logic moved into a single `selectEntryFile(files)` helper inside `FilesService`. Strategies became pure storage. Eliminates duplication and centralises per-format rules.
2. **`Record<ext, number>` validator extension** — `FileSizeValidator` constructor now accepts either a flat number (existing callers) or an extension-keyed map plus a fallback. Per-format limits are enforced server-side; the client uses a single coarse `maxSize` on the Mantine Dropzone.
3. **`.mtl` rejected at controller level** — `.mtl` is useless without `.obj`, so it is excluded from `ACCEPTED_3D_MODEL_FILE_TYPES` and only allowed inside the zip-extracted-files allowlist.
4. **Zip allowlist expanded** with `.obj/.mtl/.dae/.fbx/.stl` plus auxiliary texture types `.tga/.bmp/.tif/.tiff` that FBX and OBJ exports commonly reference.
5. **Per-format entry-file rules with mixed-format rejection** — exactly-one for `.gltf/.glb/.fbx/.dae/.stl`; OBJ allows multiple files and picks the largest by byte size (lexicographic tiebreak); archives containing more than one entry-point format type return HTTP 400.
6. **`originalFormat` derivation** — non-zip uploads derive it from `extname(file.originalname)`; zip uploads derive it from the entry file's extension after extraction; legacy rows default to `'glb'` via the migration's `DEFAULT 'glb'`.
7. **Default `MeshStandardMaterial` fallback** applied inside per-format loaders (`loadFbx`, `loadDae`, `loadStl`) so the rest of the viewer code stays format-agnostic. OBJ-without-MTL also benefits via the MTL try/catch.
8. **XHR-based upload helper** instead of RTK Query `fetchBaseQuery` (which doesn't expose `onUploadProgress`). The `shared/api/uploadModel3DWithProgress.ts` helper stays FSD-pure (no `Api` import); the widget hook calls `Api.util.invalidateTags` after success to keep RTK cache invalidation behaviour.
9. **`Object3D` widening of `LoadedModel3D.scene`** — `ColladaLoader` returns a generic scene Object3D, not a `Group`. Widening the type covers all five loaders without per-loader casts at the call site.
10. **Mantine badge color map** — `glb/gltf=blue, fbx=orange, obj=grape, dae=teal, stl=gray` placed in a co-located `constants.ts` next to the card. Plus the conditional OBJ-tip Alert in the upload modal.

---

## ITER-7 SUMMARY

**Status:** ✅ Completed

**Scope:** Scene-side review system at parity with model-side: 3D annotation pins (with optional `scene_object_id` link, `cameraPos` for fly-to, drag-to-reorder), threaded comments, public scene page at `/scenes/:sceneId`, and `@OptionalUser()` access control on read endpoints.

### What was implemented

**Database**

| File | Change |
|---|---|
| `server/src/database/constants.ts` | Added `SceneAnnotation: 'scene_annotation'` and `SceneComment: 'scene_comment'` to `ScenesSchemaTables` |
| `server/src/database/entities/scenes/scene-annotation.entity.ts` | New entity — extends `GuidIdEntityBase`; `sceneId` (CASCADE), `sceneObjectId` nullable (SET NULL), `userId` (eager); `label varchar(120)`, `body text` nullable, `posX/Y/Z`, `cameraPosX/Y/Z` nullable, `order` int default 0; index on `sceneId` |
| `server/src/database/entities/scenes/scene-comment.entity.ts` | New entity — extends `GuidIdEntityBase`; `sceneId` (CASCADE), `authorId` (eager), `parentId` nullable self-FK (SET NULL); `body text`, `resolved boolean` default false; indexes on `sceneId` + `parentId` |
| `server/src/database/migrations/scenes/1777700000000-AddSceneAnnotation.ts` | Creates `scenes.scene_annotation` with all 3 FKs, index, fully reversible `down()` |
| `server/src/database/migrations/scenes/1777700100000-AddSceneComment.ts` | Creates `scenes.scene_comment` with all 3 FKs (incl. self-FK), 2 indexes, fully reversible `down()` |

**Backend — Scene Annotations submodule** (`server/src/modules/scenes/annotations/`)

| File | Change |
|---|---|
| `dto/scene-annotation.create.request.dto.ts` | `label` (max 120, required), `body?`, `posX/Y/Z` (required), `cameraPosX/Y/Z?`, `sceneObjectId?` |
| `dto/scene-annotation.update.request.dto.ts` | All fields optional |
| `dto/scene-annotation.reorder.request.dto.ts` | `{ items: { id: uuid, order: int }[] }` |
| `dto/scene-annotation.response.dto.ts` | Full annotation with embedded `author` summary `{ id, firstName, lastName, avatarUrl }` |
| `mappers/scene-annotation.mapper.ts` | `toResponse(entity)` plain class |
| `repositories/scene-annotation.repository.ts` | `findBySceneId`, `findById`, `save`, `softDelete`, `bulkUpdateOrder` |
| `scene-annotations.service.ts` | 5 methods (`getAnnotations`, `createAnnotation`, `updateAnnotation`, `deleteAnnotation`, `reorderAnnotations`); read uses `assertCanReadScene` (public allowed via `@OptionalUser()`), write uses `assertCanWriteScene` |
| `scene-annotations.controller.ts` | Route prefix `scenes/:sceneId/annotations`; `@Get()` `@Public()` + `@OptionalUser()`; POST/PATCH/DELETE/`PUT('order')` `@Roles(UserRole.User)` |
| `scene-annotations.module.ts` | Imports `TypeOrmModule.forFeature([...])` and `ScenesModule` for `ScenesService` injection |

**Backend — Scene Comments submodule** (`server/src/modules/scenes/comments/`)

| File | Change |
|---|---|
| `dto/scene-comment.create.request.dto.ts` | `body` (required), `parentId?` |
| `dto/scene-comment.update.request.dto.ts` | `body?`, `resolved?` |
| `dto/scene-comment.response.dto.ts` | Full comment with `author` summary + recursive `replies?[]` |
| `mappers/scene-comment.mapper.ts` | `toResponse` builds threaded tree from flat list |
| `repositories/scene-comment.repository.ts` | `findBySceneId`, `findById`, `findChildrenOf`, `save`, `softDelete` |
| `scene-comments.service.ts` | 4 methods; `assertCanModify` allows author OR workspace editor/admin OR scene owner; delete cascades to children via `softRemove` |
| `scene-comments.controller.ts` | Route prefix `scenes/:sceneId/comments`; `@Get()` `@Public()` + `@OptionalUser()`; POST/PATCH/DELETE `@Roles(UserRole.User)` |
| `scene-comments.module.ts` | Wired with `ScenesModule` for service injection |
| `server/src/modules/scenes/services/scenes.service.ts` | Added 4 public wrappers (`loadSceneOrThrow`, `assertCanReadScene`, `assertCanWriteScene`, `isWorkspaceEditor`) consumed by the new submodules; original private helpers untouched |
| `server/src/app.module.ts` | Registered `SceneAnnotationsModule` + `SceneCommentsModule` at app root (mirrors existing `AnnotationsModule` / `ReviewsModule` placement; avoids `ScenesModule` ↔ submodule cycle) |

**Frontend — RTK Query layer**

| File | Change |
|---|---|
| `client/src/app/api/dto.ts` | Added `SceneAnnotationAuthorDto`, `SceneAnnotationResponseDto`, `SceneAnnotationCreateRequestDto`, `SceneAnnotationUpdateRequestDto`, `SceneAnnotationReorderItemDto`, `SceneAnnotationReorderRequestDto`, `SceneCommentAuthorDto`, `SceneCommentResponseDto`, `SceneCommentCreateRequestDto`, `SceneCommentUpdateRequestDto` |
| `client/src/app/api/tags.ts` | Added `SceneAnnotations` and `SceneComments` to `ApiTags` |
| `client/src/app/api/scene-reviews.ts` | New — 9 endpoints injected via `Api.injectEndpoints({ overrideExisting: true })`; hooks `useSceneAnnotationsQuery`, `useCreateSceneAnnotationMutation`, `useUpdateSceneAnnotationMutation`, `useDeleteSceneAnnotationMutation`, `useReorderSceneAnnotationsMutation`, `useSceneCommentsQuery`, `useAddSceneCommentMutation`, `useUpdateSceneCommentMutation`, `useDeleteSceneCommentMutation` |

**Frontend — Scene Editor Review tab**

| File | Change |
|---|---|
| `client/src/widgets/SceneAnnotationManager/SceneAnnotationManager.tsx` | New — dnd-kit sortable cards inside Mantine `Timeline.Item` rail with `IconMapPin` bullets; "Annotate" toggle drives `viewer.setMode('annotate')` and registers a placement callback; raycast walks parent chain to capture `userData.sceneObjectId`; per-card "fly-to" uses `viewer.camera.flyTo`; "highlight linked object" routes through `onSelectAnnotation` → `selectObject`; markers spawned/cleared on `viewer.world` on every list change; reorder persists via `useReorderSceneAnnotationsMutation`; `readOnly?: boolean` prop hides controls for the public page |
| `client/src/widgets/SceneAnnotationManager/SceneAnnotationManager.module.scss` | Layout + Timeline styling |
| `client/src/widgets/ReviewPanel/ReviewPanel.tsx` | Added `scope?: 'model' \| 'scene'` (default `'model'`) and optional `sceneId`; internally splits into `ModelReview` / `SceneReview` against a `ScopeAdapter` interface so `CommentCard` / `CommentInput` are reused; comment input + reply links gated behind `isAuthenticated` |
| `client/src/widgets/Model3DViewer/classes/Viewer/Viewer.ts` | Extended `onScenePointerDown` callback with third arg `sceneObjectId: string \| null` (walks up parents from intersected mesh); raycast now traverses `world.scene` to support multi-object scenes (no `this.model`); existing model-editor callers untouched |
| `client/src/pages/SceneEditor/components/Navbar/constants.ts` | Added `Review: 'review'` |
| `client/src/pages/SceneEditor/components/Navbar/utils.tsx` | Added 5th tab entry with `IconMessage` rendering `<SceneReviewPanel>` |
| `client/src/pages/SceneEditor/components/Navbar/SceneNavbar.tsx` | Added `viewer` prop, threaded into `getSceneTabsConfig`; added `review: 'Review'` tooltip entry |
| `client/src/pages/SceneEditor/SceneEditorPage.tsx` | Destructured `viewer` from `useSceneViewer` and passed to `<SceneNavbar>` |
| `client/src/pages/SceneEditor/panels/SceneReviewPanel.tsx` | New — `<ScrollArea>` with `SceneAnnotationManager` + `<Divider />` + `<ReviewPanel scope="scene" sceneId={sceneId} />` |

**Frontend — Public Scene page**

| File | Change |
|---|---|
| `client/src/pages/PublicScene/index.tsx` | Barrel re-export |
| `client/src/pages/PublicScene/PublicScenePage.tsx` | Reads `:sceneId` from params; loads via `useSceneQuery`; loading state (`<Center><Loader/></Center>`); 403/private state (`IconLock` + Title + dimmed Text + browse button); success state mounts read-only viewer + right-side aside with `SceneAnnotationManager readOnly` + `Divider` + `ReviewPanel scope="scene"`; mobile uses `hiddenFrom`/`visibleFrom` + floating `IconMessage` ActionIcon + `Drawer position="right" size="90vw"` via `useDisclosure()`; "Open in Editor" button shown when user has write access |
| `client/src/pages/PublicScene/PublicScenePage.module.scss` | Layout styles for viewer + aside + mobile FAB |
| `client/src/pages/PublicScene/hooks/usePublicSceneViewer.ts` | View-only sibling of `useSceneViewer` (~70 lines): viewer init, scene load + autoplay audio, `selectObject` helper. Avoids cross-page imports (FSD violation) |
| `client/src/shared/router/paths.ts` | Added `PublicScene: 'scenes/:sceneId'` |
| `client/src/app/router/index.tsx` | Added top-level lazy route `/scenes/:sceneId` inside the `BasePage` parent (inherits `BaseLayout`), outside any auth-gated subtree |

### REST API surface added

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/scenes/:sceneId/annotations` | Public + OptionalUser | List scene annotations (access-checked) |
| POST | `/api/scenes/:sceneId/annotations` | JWT + write access | Create annotation |
| PATCH | `/api/scenes/:sceneId/annotations/:annotId` | JWT + write access | Update annotation |
| DELETE | `/api/scenes/:sceneId/annotations/:annotId` | JWT + write access | Delete annotation |
| PUT | `/api/scenes/:sceneId/annotations/order` | JWT + write access | Bulk reorder |
| GET | `/api/scenes/:sceneId/comments` | Public + OptionalUser | List threaded comments |
| POST | `/api/scenes/:sceneId/comments` | JWT + read access | Add comment / reply |
| PATCH | `/api/scenes/:sceneId/comments/:commentId` | JWT + author or editor | Update body / resolve |
| DELETE | `/api/scenes/:sceneId/comments/:commentId` | JWT + author or editor | Soft-delete + cascade children |

### Design decisions made

1. **Annotation schema mirrors `model_annotation`** — added `label` + `body` + `cameraPos` rather than the spec's single `text` column, so the existing AnnotationManager-style UX (fly-to-camera, list cards) ports over with no plumbing changes. Plus a new `scene_object_id` nullable FK that the model schema doesn't have, used for "click annotation → highlight linked object".
2. **Submodules nested under `modules/scenes/`** rather than top-level — model-side `annotations/` and `reviews/` live at top-level, but for scenes we colocate under `scenes/` so all scene-related code stays grouped. Both submodules import `ScenesModule` to inject the read/write access helpers; registering them at app root (sibling pattern) avoided a `ScenesModule ↔ submodule` cycle.
3. **`AnnotationManager` extended with Timeline rail, not replaced** — kept dnd-kit reorderable cards; wrapped them in `Timeline.Item` with `IconMapPin` bullets and `active` index tracking the most recently selected/fly-to-ed card. Best of both worlds: spec's Timeline visual + existing reorder UX.
4. **`ReviewPanel` got a `scope` prop** instead of duplicating the widget — the rendering code is identical between model and scene comments (both have `id, body, resolved, parentId, author, replies?`), so a small `ScopeAdapter` selects the right RTK hook family. Default `scope='model'` keeps existing call sites working without edits.
5. **Public model page (ITER-7 step 9) skipped** — comments + annotations are already exposed via `ReviewDrawerButtons` on the existing public model page; no work needed.
6. **Mobile uses Mantine `hiddenFrom`/`visibleFrom`** props — repo convention, no `useMediaQuery` import added (the hook isn't used anywhere else in the codebase).
7. **`Viewer.onScenePointerDown` callback signature widened** with a third `sceneObjectId` arg via parent-chain walk on the intersected mesh. Existing model-editor callers that destructure only `(worldPos, cameraPos)` continue to typecheck (unused params are fine). Also extended raycast traversal to `world.scene` so multi-model scenes hit-test correctly even without a `this.model`.
8. **`usePublicSceneViewer` is a separate ~70-line hook**, not a reuse of `useSceneViewer` from `pages/SceneEditor/`, because cross-page imports violate FSD. Drops every editor-specific concern (transform controls, light/HDRI updaters, animation accessors, screenshot, light selection); keeps only viewer init + scene load + audio autoplay + `selectObject`. If the duplication ever becomes load-bearing, the right fix is to lift the shared init/load logic into `widgets/Model3DViewer/hooks/`.
9. **`@OptionalUser()` reused, not added** — already shipped in an earlier iteration and already applied to `GET /scenes/:id`; the new GET endpoints simply add `@Public() + @OptionalUser()` together so anonymous users can read public/unlisted scenes' annotations + comments while authenticated users can read private workspace-scoped resources they belong to.

---

## ITER 8 SUMMARY

**Status:** ✅ Completed

**Scope:** Discovery & UX polish — global search across models + scenes, drag-and-drop upload on the personal models page, screenshot export from both viewers, in-viewport measurement tool, mesh statistics card, scene cloning, runtime display-presets menu, model→scenes traceability badge, and a "recently opened" dashboard row. **No DB migration** — every feature is service / UI / repository-only.

### What was implemented

**Backend (NestJS / TypeORM)**

| File | Change |
|---|---|
| `modules/scenes/repositories/scene.repository.ts` | Added `findScenes({ workspaceId?, userId?, search? })` — single QueryBuilder path replacing the legacy `find`/`findByUserId` split, with case-insensitive `ILIKE` filter on `name`+`description`. Added `findScenesUsingModel(modelId)` — INNER JOIN against `scene_object` filtering soft-deleted children. `findByUserId` retained for any leftover callers |
| `modules/scenes/services/scenes.service.ts` | `listScenes` accepts `search?`, delegates to `findScenes` for both branches. New `cloneScene(id, user)` — read-access checked, target ownership decided via `isWorkspaceEditor` (workspace clone in-place if editor; otherwise personal `userId`/`workspaceId=null`/`visibility='private'`); deep-clones `scene_object` and `scene_light` rows via repositories; HDRI path **explicitly nulled** on the clone (intentional simplification — see decision #2). New `listScenesUsingModel(modelId, user|null)` — JS post-filter against `requireSceneReadAccess` (drop scenes the viewer cannot read) |
| `modules/scenes/controllers/scenes.controller.ts` | `listScenes` signature extended with `@Query('search') search?: string`. New `@Get('using-model/:modelId') @Public() @OptionalUser()` handler. New `@Post(':id/clone') @Roles([UserRoles.User])` handler returning `SceneListItemResponseDto` |
| `modules/models-3d/services/model-3d.service.ts` | Drive-by: wired the previously-no-op `search` DTO field into `find3DModels` via `model.name ILIKE :search` (description is `jsonb` and intentionally excluded) — required because the new ITER-8 search UI queries this endpoint |

**Three.js viewer (Phase B)**

| File | Change |
|---|---|
| `widgets/Model3DViewer/classes/MeasureTool/MeasureTool.ts` | New — pointer-down raycaster against `world.scene`; first click captures point A, second click captures B + draws a `Line2`/`LineGeometry`/`LineMaterial` segment plus a `CSS2DObject` label (`distance.toFixed(2) m`) at midpoint, then resets to "first click" state for repeated measures. ESC → `viewer.setMode('view')`. `LineMaterial` configured with `depthTest: false` + `renderOrder: 999` so the line stays visible through geometry |
| `widgets/Model3DViewer/classes/MeasureTool/index.ts` | Barrel re-export |
| `widgets/Model3DViewer/classes/types/viewer.ts` | `ViewerMode` union extended with `'measure'` |
| `widgets/Model3DViewer/classes/Viewer/Viewer.ts` | Constructs `MeasureTool` after `world`/`renderer` are ready; `setMode` records previous mode and calls `measureTool.start()` / `.stop()` on transitions in/out of `'measure'`, mirroring the `'annotate'` lifecycle. `destroy()` also disposes the tool |
| `widgets/Model3DViewer/classes/Renderer/Renderer.ts` | Constructs a `CSS2DRenderer` alongside `WebGLRenderer`, appends its DOM element to the same `place` container (positioned absolute, `pointer-events: none`, `z-index: 1`), renders it after `composer.render()`, syncs size on resize, and removes the DOM element on destroy |

**Frontend — RTK Query layer**

| File | Change |
|---|---|
| `app/api/scenes.ts` | Existing `scenes` query type extended with `search?: string`; new `cloneScene` mutation invalidating the scenes-list tag |
| `app/api/models-3d.ts` | `Models3DQueryParams` extended with `search?`; new `getScenesUsingModel(modelId)` query returning `SceneListItemResponseDto[]` |
| `app/api/dto.ts` | Untouched — every new endpoint reuses `SceneListItemResponseDto` |

**Frontend — Search**

| File | Change |
|---|---|
| `widgets/SearchInput/SearchInput.tsx` | New — Mantine 9 `Combobox` + `TextInput`, 300 ms debounce via `useDebouncedValue`. Both `useModels3DQuery` and `useScenesQuery` skip until the trimmed query is ≥ 2 chars. Two `Combobox.Group`s with thumbnails, format/scene badges, and a Russian `Combobox.Empty` fallback |
| `widgets/SearchInput/index.tsx` | Barrel |
| `widgets/Header/index.tsx` | Slotted `<SearchInput visibleFrom="md">` between `OrgSwitcher` and the auth/user controls (only when authenticated) |

**Frontend — Drag-and-drop upload**

| File | Change |
|---|---|
| `pages/UserModels3D/index.tsx` | `document.body` `dragenter`/`dragleave`/`dragover`/`drop` listeners with the enter-counter pattern; accepted-extension filter via `ACCEPTED_3D_MODEL_FILE_TYPES`; renders an animated `<Transition><Overlay>` with `IconUpload` + Russian prompt |
| `widgets/Upload3DModelModal/useUpload3DModal.ts` | Hook accepts an optional `initialFile?: File` — when set (and changed), calls `setModel(initialFile)` and `open()` exactly once. Existing call sites are unaffected |
| `widgets/Upload3DModelModal/index.tsx` | Forwards the new prop to the hook |

**Frontend — Viewer toolbar**

| File | Change |
|---|---|
| `widgets/Model3DViewer/components/Model3DViewerBottomBar/components/ScreenshotButton/index.tsx` | New — calls `viewer.renderer.getScreenshot()` (existing API), converts the data URL to a Blob, triggers an `<a download>` with filename `${model name}-${timestamp}.png` |
| `widgets/Model3DViewer/components/Model3DViewerBottomBar/components/DisplayPresetsMenu/index.tsx` | New — Mantine `Menu` listing `DISPLAY_PRESETS` with `Menu.Item description={preset.description}`; click applies via `viewer.renderer.setSettings({ ...preset.rendererConfig, clearColor: preset.backgroundColor })` and `viewer.renderer.setPostProcessing(preset.postProcess ?? {})` (in-session only, no DB persistence) |
| `widgets/Model3DViewer/components/Model3DViewerBottomBar/components/MeasureToggleButton/index.tsx` | New — local state mirror of mode (Viewer keeps `_mode` private without a reactive getter); click flips between `'measure'` and `'view'`; `variant="light"` + `color="blue"` active style |
| `widgets/Model3DViewer/components/Model3DViewerBottomBar/index.tsx` | Slots ScreenshotButton, DisplayPresetsMenu, and MeasureToggleButton between AudioToolbar and ToggleFullscreenButton |
| `pages/SceneEditor/panels/SceneEditorTopBar.tsx` | Added `IconDownload` ActionIcon next to the existing "Capture Thumbnail" button — same `captureScreenshot()` data URL, but downloaded instead of uploaded |

**Frontend — Mesh stats / scene clone / "Used in N scenes"**

| File | Change |
|---|---|
| `pages/Editor/components/Navbar/components/SceneTab/components/MeshStatsCard/index.tsx` | New — traverses `viewer.world.scene`, counts meshes / vertices / faces (indexed vs. non-indexed handled), unique materials and textures by id; `Box3.setFromObject` for bounding box. Recomputes on `WorldEventNames.WorldSceneChange` (the same event idiom already consumed by `SceneTab/index.tsx`); rendered as `SimpleGrid cols={2}` of mini `Paper withBorder` cards |
| `pages/Editor/components/Navbar/components/SceneTab/index.tsx` | Slotted `<MeshStatsCard viewer={viewer} />` after `LayersCheckboxGroup` |
| `pages/Scenes/ScenesPage.tsx` | Added a three-dot Menu with "Дублировать" item per scene card, wired to `useCloneSceneMutation` with success notification |
| `pages/UserScenes/UserScenesPage.tsx` | Same "Дублировать" item added to the existing per-card menu |
| `widgets/Models3DList/components/Model3DCard/index.tsx` | Calls `useGetScenesUsingModelQuery` and renders a `<Badge color="teal">В N сцен(е/ах)</Badge>` near the format badge when the count is > 0 |

**Frontend — Recently opened**

| File | Change |
|---|---|
| `shared/utils/recentlyOpened.ts` | `pushRecent(userId, kind, item)` / `getRecent(userId)` / `clearRecent(userId)`; key `@mesh_hub/recent:${userId}`; dedup by id; max 5 each; try/catch around `localStorage` access so a quota / disabled-storage failure never crashes the app |
| `pages/Editor/index.tsx` | `useEffect` pushes the loaded model to recents (skipped silently if anonymous) |
| `pages/SceneEditor/SceneEditorPage.tsx` | Same pattern for the scene editor |
| `pages/PublicScene/PublicScenePage.tsx` | Same pattern; only fires when `currentUser?.id` is set |
| `pages/OrgDashboard/WorkspaceDashboard.tsx` | Renders a "Недавно открытые" `ScrollArea` row of compact thumbnail cards above existing content; renders nothing when both lists are empty (no empty placeholder) |

### REST API surface added

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/scenes?search=<term>` | JWT | Filter list by case-insensitive name/description match (existing endpoint, new param) |
| POST | `/api/scenes/:id/clone` | JWT | Deep-clone scene + objects + lights into the same workspace (if editor) or as a personal scene; returns the new `SceneListItemResponseDto` |
| GET | `/api/scenes/using-model/:modelId` | Public + OptionalUser | List scenes that include a given model as an object, post-filtered for read access |

Plus drive-by: `GET /api/models-3d?search=<term>` — the previously-declared but never-applied `search` DTO field now actually filters via `model.name ILIKE`.

### Design decisions made

1. **No DB migration** — every feature is service / repository / UI only. The clone endpoint reuses existing entity/repository patterns; the search endpoints reuse existing rows.
2. **HDRI binary not copied on clone** — the cloned scene's `config.environmentHdriPath` is explicitly nulled out. Cross-strategy copies (e.g. workspace S3 source → personal local target) are messy and the file is a re-uploadable asset; users get a clean draft with no file ambiguity. Annotations and comments are likewise dropped — a fresh copy starts with no review threads (spec was silent; this is the safer default).
3. **`scene.thumbnailPath` not copied on clone** — same reasoning as the HDRI: the user can capture a new thumbnail post-clone.
4. **Used-in-N-scenes endpoint hosted on `ScenesController`, not `Models3DController`** — keeps the `assertCanReadScene` access-control helpers local. The endpoint is mounted under `/api/scenes/using-model/:modelId` rather than under the model resource so the access-check ownership is unambiguous.
5. **`displayPresets.ts` field names**: viewer wiring uses `preset.rendererConfig` (mapped through `setSettings`, with `clearColor: preset.backgroundColor` merged in) and `preset.postProcess ?? {}` (mapped through `setPostProcessing`). Descriptions piped 1:1 into Mantine 9 `Menu.Item description`.
6. **Measure mode tracking on the toolbar uses a local state mirror** because `Viewer._mode` is private without a reactive getter. The button toggles the mirror and calls `viewer.setMode(...)`; if the mode is changed from elsewhere the button can drift, but inside the editor the toolbar is the only producer.
7. **Per-card "Used in N scenes" query fan-out is accepted as-is** — RTK Query dedupes shared cache keys, the count rarely changes, and lifting the queries up to the parent list would couple `Models3DList` to a scene-domain DTO. Flagged as a follow-up perf concern if model lists grow.
8. **Recently-opened key is per-user (`@mesh_hub/recent:${userId}`)** — prevents cross-user leakage on shared devices and avoids stale entries after account switching. Per-browser storage is by design; future cross-device sync would need a real backend table.
9. **Search uses `ILIKE` on `scene.name` + `scene.description`** but `model.name` only — the `Model3dEntity.description` column is `jsonb`, not text, so it's intentionally excluded.
10. **`CSS2DRenderer` shares the same `place` container** as the WebGL canvas, with `pointer-events: none` and `z-index: 1`. Reused for the measure-tool label; available for any future label-in-3D-space UI.
11. **Phase A backend changes were re-implemented in the main session** after the first dispatch's edits failed to persist into the working tree — no functional difference in the final result, just a longer path.

---

## Post-MVP Items (out of scope for these iterations)

| Item | Notes |
|---|---|
| CAD formats (STEP/IGES/IFC) | Requires separate viewer mode + conversion pipeline |
| Particle systems | GPU-accelerated, complex editor needed |
| AR / WebXR full mode | Requires USDZ conversion + device testing |
| Real-time collaboration | WebSocket OT/CRDT — major infrastructure |
| AI asset generation | External API integration + credits system |
| Point clouds (PLY) | Large file handling + custom renderer |
| Alembic (ABC) | Complex animation format, low demand |
