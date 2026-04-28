# MeshHub — Current Working Plan

## Overview

This plan covers the product roadmap from foundation to full platform. Each iteration builds on the previous and produces a deployable increment.

---

## Iteration Summary

| # | Name | Status | Key Deliverable |
|---|---|---|---|
| [ITER-1](ITER-1.md) | Foundation: DB + Personal Scenes & Models | ✅ Done | Personal scope for models/scenes, `visibility` field, personal routes |
| [ITER-2](ITER-2.md) | Scene Editor: Complete UI | 🔲 Pending | Objects/Lights/Config panels, real-time canvas, scene state sync |
| [ITER-3](ITER-3.md) | Model Editor: Lights, Display Config & Post-Processing | 🔲 Pending | Custom lighting, renderer settings, EffectComposer pipeline, display presets |
| [ITER-4](ITER-4.md) | Model Editor: Materials & Textures | 🔲 Pending | Per-mesh material overrides, PBR sliders, texture uploads |
| [ITER-5](ITER-5.md) | Animations Enhanced + Audio | 🔲 Pending | Speed/loop/crossfade in AnimationToolbar, scene object animations, Three.js audio |
| [ITER-6](ITER-6.md) | Multi-Format Support | 🔲 Pending | FBX / OBJ+MTL / DAE / STL loader registry |
| [ITER-7](ITER-7.md) | Review & Annotations: Scenes + Access Control | 🔲 Pending | Scene annotations/comments, `@OptionalUser` access control, public scene page |
| [ITER-8](ITER-8.md) | Discovery & UX Polish | 🔲 Pending | Search, DnD upload, presets menu, measure tool, screenshot, scene clone |
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
