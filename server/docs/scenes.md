# Scenes

## Scope

The Scenes domain backs the MeshHub scene editor. A **scene** is a workspace- or user-owned composition that places references to existing 3D models (`scene_object`) into a shared space, lights it (`scene_light`), and configures global rendering (`SceneConfig`: background colour, ambient intensity, optional HDRI environment map, camera bookmarks). Scene objects carry per-object animation and audio configuration. Scenes also host their own **annotations** (world-space markers with optional camera anchor, separate from model annotations) and **comments** (threaded). HDRI environments and a base64-uploaded thumbnail are persisted via `IFileStorageStrategy`. Scenes can be referenced as embed targets — see [embed.md](embed.md).

Module: [`server/src/modules/scenes/`](../src/modules/scenes/), wired in `app.module.ts` as `ScenesModule`, `SceneAnnotationsModule`, `SceneCommentsModule`.

---

## Entities

All entities live in [`server/src/database/entities/scenes/`](../src/database/entities/scenes/) and extend `GuidIdEntityBase` (UUID id + `createdAt` / `updatedAt` / `deletedAt`). Schema: `scenes`. Table names from [`src/database/constants.ts`](../src/database/constants.ts) `ScenesSchemaTables`.

| Entity | Table | Key fields | FKs / relations | Notes |
|---|---|---|---|---|
| `SceneEntity` | `scenes.scene` | `name` (varchar 100), `description?`, `config jsonb`, `thumbnail_path?`, `visibility` (`public` \| `private` \| `unlisted`, default `private`) | `workspace_id?` → `workspaces.workspace` (CASCADE), `user_id?` → `users.user` (CASCADE); one-to-many `objects`, `lights` | DB check `CHK_scene_owner`: at least one of `user_id` / `workspace_id` must be non-null. Indexed by both. Soft-deletable. |
| `SceneObjectEntity` | `scenes.scene_object` | `pos_{x,y,z}`, `rot_{x,y,z}`, `scale_{x,y,z}` (floats), `order int`, `animation_config jsonb?`, `audio_config jsonb?` | `scene_id` → `scene` (CASCADE), `model_id` → `model_3d.model_3d` (no cascade) | A placement of an existing 3D model on a scene. `animation_config` / `audio_config` added in ITER-8 — see JSON shape below. Indexed on `scene_id`, `model_id`. |
| `SceneLightEntity` | `scenes.scene_light` | `type` enum (`directional` \| `point` \| `spot`), `pos_{x,y,z}`, `color` (`#rrggbb`), `intensity float`, `cast_shadow bool` | `scene_id` → `scene` (CASCADE) | Per-scene light source. Indexed on `scene_id`. |
| `SceneAnnotationEntity` | `scenes.scene_annotation` | `label` (varchar 120), `body? text`, `pos_{x,y,z}` (`double precision`, world-space), `camera_pos_{x,y,z}?` (optional camera anchor), `order int` | `scene_id` → `scene` (CASCADE), `scene_object_id?` → `scene_object` (SET NULL), `user_id` → `user` (CASCADE, eager) | Author is loaded eagerly. Optionally pinned to a `scene_object` — pin survives only as long as the object isn't hard-deleted. |
| `SceneCommentEntity` | `scenes.scene_comment` | `body text`, `resolved bool` | `scene_id` → `scene` (CASCADE), `author_id` → `user` (CASCADE, eager), `parent_id?` → `scene_comment` (SET NULL) | Self-referential threading via `parent_id`. Top-level comments have `parent_id = NULL`. Children re-parent to root on parent hard-delete. |

### `scene_object.animation_config` JSON shape

Validated by `AnimationConfigDto` in [`scene-object.upsert.dto.ts`](../src/modules/scenes/dto/scene-object.upsert.dto.ts):

```jsonc
{
  "autoplay": true,
  "activeClipName": "Idle",       // null to clear
  "loop": "repeat",
  "speed": 1.0,
  "sequence": [                   // optional ordered list of clips
    { "name": "Idle", "loop": "once", "transitionDuration": 0.25 }
  ]
}
```

### `scene_object.audio_config` JSON shape

Validated by `SceneObjectAudioConfigDto`:

```jsonc
{
  "audioId": "uuid",   // references model_3d.model_audio
  "loop": true,
  "volume": 0.8,
  "positional": true,
  "maxDistance": 25,
  "autoplay": false
}
```

Both columns are nullable. The service uses `'animationConfig' in dto` / `'audioConfig' in dto` membership semantics on update so an explicit `null` clears the column.

### `SceneConfig` (jsonb on `scene.config`)

Defined by [`scene-config.type.ts`](../src/database/entities/scenes/scene-config.type.ts):

```typescript
interface SceneConfig {
  backgroundColor: string;
  ambientLightIntensity: number;
  environmentHdriPath?: string;       // set after HDRI upload
  cameraBookmarks: SceneCameraBookmark[];
}
```

`defaultConfig()` (private, `ScenesService`) returns `{ backgroundColor: '#000000', ambientLightIntensity: 0.5, cameraBookmarks: [] }`.

---

## List vs. Detail DTOs

ITER-10 split scene response shapes to keep list endpoints cheap. Both DTOs live in [`scene.response.dto.ts`](../src/modules/scenes/dto/scene.response.dto.ts).

| DTO | Includes | Used by |
|---|---|---|
| `SceneListItemResponseDto` | `id`, owner ids, `visibility`, `name`, `description`, `thumbnailPath`, **`objectCount`** (precomputed), `createdAt`, `updatedAt` | `GET /scenes`, `GET /scenes/using-model/:modelId`, `POST /scenes/:id/clone` |
| `SceneResponseDto` | All list fields plus `config`, full `objects[]` (with model + entry file + animation/audio configs), full `lights[]` | `POST /scenes`, `GET /scenes/:id`, `PATCH /scenes/:id`, every object/light mutation, `POST /scenes/:id/hdri`, `POST /scenes/:id/thumbnail` |

`SceneMapper.toListItemResponse` (in [`scene.mapper.ts`](../src/modules/scenes/mappers/scene.mapper.ts)) computes `objectCount = (entity.objects ?? []).length`. The list query (`SceneRepository.findScenes`) joins `scene.objects` only for the count; the detail query (`loadSceneWithRelations`) eagerly joins `objects.model.file` and `lights`.

---

## Plan Limits

From [`src/constants/plan-limits.ts`](../src/constants/plan-limits.ts):

| Plan | `maxObjects` | `maxLights` | `hdriEnabled` |
|---|---|---|---|
| `Starter` | 3 | 2 | false |
| `Growth` | 15 | 10 | true |
| `Enterprise` | `Infinity` | `Infinity` | true |

Personal scenes (no `workspaceId`) fall back to `SCENE_LIMITS[PlanType.Starter]` regardless of who the owner is — see `ScenesService.getPlanLimitsForScene`.

Enforcement points in [`scenes.service.ts`](../src/modules/scenes/services/scenes.service.ts):

- `addObject` — counts objects via `SceneObjectRepository.countByScene`; throws `ForbiddenException('Object limit reached for your plan')` if `count >= maxObjects`.
- `addLight` — same pattern with `SceneLightRepository.countByScene` and `maxLights`.
- `uploadHdri` — throws `ForbiddenException('HDRI environment is not available on your plan')` when `hdriEnabled === false`.

Limits are looked up per-request through the workspace's organization (`getPlanLimits` → `OrganizationEntity.planType` → `SCENE_LIMITS[planType]`). There is no caching.

---

## Storage Quota Integration

`StorageQuotaService` ([`src/modules/storage-quota/storage-quota.service.ts`](../src/modules/storage-quota/storage-quota.service.ts)) is **not currently wired into the scenes module**. HDRI and thumbnail uploads enforce only the per-route Multer size limit (HDRI 20 MB) and the plan flag (`hdriEnabled`). The shared org storage quota (which sums `model_3d_file.size` rows) does not include scene HDRI/thumbnail bytes today, and `ScenesModule` does not import `StorageQuotaModule`.

If quota enforcement is added later, the natural insertion points are `ScenesService.uploadHdri` and `ScenesService.saveThumbnail`, gated by `StorageQuotaService.checkStorageQuotaByWorkspace(scene.workspaceId)` before calling `FilesService.saveSceneHdri` / `saveSceneThumbnail`.

---

## HDRI

Upload flow (controller method `uploadHdri` in [`scenes.controller.ts`](../src/modules/scenes/controllers/scenes.controller.ts)):

1. `POST /scenes/:id/hdri` (multipart, field `file`).
2. `FileInterceptor` writes the upload to `./files/models-3d/temp` with `fileSize` cap `HDRI_MAX_SIZE_BYTES = 20 * 1024 * 1024`.
3. `ScenesService.uploadHdri` resolves write access, checks `limits.hdriEnabled`, then resolves the org id from the scene's workspace and calls `FilesService.saveSceneHdri(orgId, sceneId, file)`. For personal scenes (no workspace) it passes `null` and the local FS strategy handles it.
4. The strategy writes to **`scenes/<sceneId>/environment.hdr`** (note: the canonical filename is `environment.hdr`, not `hdri.hdr`. [`file-storage.md`](file-storage.md) lists `hdri.hdr` — the actual code in `fs.files.strategy.ts:154-158` and `s3.files.strategy.ts:235-237` writes `environment.hdr`).
5. `scene.config.environmentHdriPath = 'environment.hdr'` is persisted.

Read flow (`getHdriFile`, public):

- `GET /scenes/:id/hdri` — for workspace scenes the service asks the org strategy for a `getFileUrl('scenes/<sceneId>/environment.hdr')`. If the result is an absolute `http(s)://` URL (S3 backend), the controller issues a `307` redirect. Otherwise the file is streamed via `StreamableFile` from `process.cwd()/files/scenes/<sceneId>/environment.hdr` with `Content-Type: application/octet-stream`.

Allowed only on plans where `SCENE_LIMITS[plan].hdriEnabled === true` (Growth, Enterprise).

---

## Thumbnail

Save flow:

1. `POST /scenes/:id/thumbnail` with body `{ "thumbnail": "data:image/png;base64,<...>" }`.
2. `ScenesService.saveThumbnail` strips the `data:image/png;base64,` prefix, decodes to a `Buffer`, and calls `FilesService.saveSceneThumbnail(orgId, sceneId, buffer)`.
3. `IFileStorageStrategy.saveSceneThumbnail` writes the PNG to `scenes/<sceneId>/thumbnail.png` (FS: `fs.files.strategy.ts:165-168`; S3: `s3.files.strategy.ts:245-250`). The ITER-10 fix routed thumbnail saves through the strategy interface so S3-backed orgs work too — there is no direct `fs.writeFile` in the service.
4. `scene.thumbnailPath = 'scenes/<sceneId>/thumbnail.png'` is persisted.

There is no MIME validation on the thumbnail body — it's assumed to be a base64 PNG produced by the editor's canvas snapshot.

Scene file directory cleanup happens through `FilesService.deleteSceneFiles(orgId, sceneId)` (called fire-and-forget from `deleteScene`), which calls `IFileStorageStrategy.deleteSceneFiles(sceneId)` to wipe the entire `scenes/<sceneId>/` tree.

---

## Public Scene Access

Three controller routes opt out of `JwtAuthGuard` via `@Public()` and use `@OptionalUser()` to receive the viewer's identity if a session cookie happens to be present:

| Route | Access logic |
|---|---|
| `GET /scenes/:id` | `assertCanReadScene` — `public` and `unlisted` are open to anyone (including unauthenticated). `private` requires the viewer to be a workspace member (workspace scene) or the owner (personal scene). |
| `GET /scenes/:id/hdri` | No auth check at all — any client that knows the scene id can pull the HDRI. (Treat the file URL as semi-public.) |
| `GET /scenes/using-model/:modelId` | Returns scenes referencing a given model, filtered to those the (optional) viewer can read. |

Annotations and comments expose `GET` lists publicly (subject to the scene's read access). Scene comments use `assertCanReadScene` even for `addComment` — anyone who can read the scene can comment. Edits/deletes go through `assertCanModify` (author OR workspace editor).

Scenes are also reachable through the public embed surface: see [`EmbedService`](../src/modules/embed/services/embed.service.ts) — `getSceneForEmbed` bypasses visibility entirely; the API key + domain whitelist is the auth surface for embeds.

---

## Annotations

Module: [`server/src/modules/scenes/annotations/`](../src/modules/scenes/annotations/) (`SceneAnnotationsModule`). Imports `ScenesModule` to reuse `assertCanReadScene` / `assertCanWriteScene`.

### Position fields

Stored as **world-space coordinates** on the scene (not relative to any object), even when `scene_object_id` is set. Type is `double precision` (more headroom than `scene_object`'s `float`/`real`) because annotations use raw three.js `Vector3` snapshots from the editor. `camera_pos_{x,y,z}` is optional and stores the camera position from which the annotation was authored — used to "fly to" the annotation in the viewer.

Pinning to an object (`scene_object_id`) is informational: deleting the object hard `SET NULL`s the annotation but does not move it.

### Endpoints (route prefix `/scenes/:sceneId/annotations`)

| Method + Path | Auth | Purpose |
|---|---|---|
| `GET /scenes/:sceneId/annotations` | Public (read access required on scene) | List all annotations, ordered by `order` then `createdAt` |
| `POST /scenes/:sceneId/annotations` | `Roles([User])` + write access | Create with label / body / pos / cameraPos / sceneObjectId |
| `PATCH /scenes/:sceneId/annotations/:annotId` | write access | Partial update |
| `DELETE /scenes/:sceneId/annotations/:annotId` | write access | Soft-delete (`softRemove`) |
| `PUT /scenes/:sceneId/annotations/order` | write access | Bulk re-order: body `{ items: [{ id, order }] }`. Filters to annotations actually belonging to the scene (`bulkUpdateOrder` in [`scene-annotation.repository.ts`](../src/modules/scenes/annotations/repositories/scene-annotation.repository.ts)). 204 No Content. |

DTOs: [`scene-annotation.create.request.dto.ts`](../src/modules/scenes/annotations/dto/scene-annotation.create.request.dto.ts), `scene-annotation.update.request.dto.ts`, `scene-annotation.reorder.request.dto.ts`, `scene-annotation.response.dto.ts` (response packages `pos` / `cameraPos` as `{ x, y, z }` objects rather than flat columns).

---

## Comments

Module: [`server/src/modules/scenes/comments/`](../src/modules/scenes/comments/) (`SceneCommentsModule`). Imports `ScenesModule` and `WebhooksModule`.

### Threading

Single level of nesting in the DB (any comment may have `parent_id`). The mapper's `toThreadedResponse` collapses the flat list into a tree where each top-level comment carries `replies[]`. The service rejects creating a reply whose parent doesn't belong to the same scene. On delete, `deleteComment` soft-removes both the comment and its direct children (`findChildrenOf`) — replies under a deleted parent disappear with it.

### Side effects on `addComment`

`fireCommentTriggers` (fire-and-forget):

- For personal scenes, sends an in-app notification (`NotificationTypes.CommentAdded`) to `scene.userId` if the author is someone else.
- For workspace scenes, dispatches a `comment.added` webhook to the org via `WebhookDeliveryService`.

`createScene` similarly dispatches a `scene.created` webhook for workspace scenes only.

### Endpoints (route prefix `/scenes/:sceneId/comments`)

| Method + Path | Auth | Purpose |
|---|---|---|
| `GET /scenes/:sceneId/comments` | Public (read access required on scene) | Threaded list (root comments with `replies[]`) |
| `POST /scenes/:sceneId/comments` | `Roles([User])` + read access on scene | Create comment; optional `parentId` for a reply |
| `PATCH /scenes/:sceneId/comments/:commentId` | author or workspace editor | Update `body` and/or `resolved` |
| `DELETE /scenes/:sceneId/comments/:commentId` | author or workspace editor | Soft-delete comment + its direct children |

DTOs: [`scene-comment.create.request.dto.ts`](../src/modules/scenes/comments/dto/scene-comment.create.request.dto.ts) (`body` ≤ 2000 chars, optional `parentId`), `scene-comment.update.request.dto.ts` (`body?`, `resolved?`), `scene-comment.response.dto.ts`.

---

## Endpoints

### `ScenesController` — base `/scenes` ([`controllers/scenes.controller.ts`](../src/modules/scenes/controllers/scenes.controller.ts))

| Method + Path | Auth | Returns | Purpose |
|---|---|---|---|
| `POST /scenes` | `Roles([User])` | `SceneResponseDto` | Create a new scene under a workspace (`workspaceId`) or as personal (workspace omitted) |
| `GET /scenes?workspaceId=&userId=&search=` | `Roles([User])` | `SceneListItemResponseDto[]` | List scenes; exactly one of `workspaceId` / `userId` is required (`userId=me` is supported) |
| `GET /scenes/using-model/:modelId` | Public + `OptionalUser` | `SceneListItemResponseDto[]` | Scenes that reference a given 3D model, filtered to viewer-readable ones |
| `POST /scenes/:id/clone` | `Roles([User])` | `SceneListItemResponseDto` | Clone source scene (deep-copies objects + lights; HDRI is intentionally dropped, thumbnail nulled, visibility forced to `private`); cloned into the source workspace if the user is an editor there, otherwise into the user's personal scope |
| `GET /scenes/:id` | Public + `OptionalUser` | `SceneResponseDto` | Get full scene with objects + lights; visibility-gated |
| `PATCH /scenes/:id` | `Roles([User])` + write | `SceneResponseDto` | Partial update of `name`, `description`, `config`, `visibility` |
| `DELETE /scenes/:id` | `Roles([User])` + write | 204 | Soft-delete scene; fire-and-forget delete of `scenes/<sceneId>/` files |
| `POST /scenes/:id/objects` | `Roles([User])` + write | `SceneResponseDto` | Add a `scene_object` (plan-limit gated) |
| `PATCH /scenes/:id/objects/:objId` | `Roles([User])` + write | `SceneResponseDto` | Partial transform / animation / audio update |
| `DELETE /scenes/:id/objects/:objId` | `Roles([User])` + write | 204 | Soft-delete object |
| `POST /scenes/:id/lights` | `Roles([User])` + write | `SceneResponseDto` | Add a `scene_light` (plan-limit gated) |
| `PATCH /scenes/:id/lights/:lightId` | `Roles([User])` + write | `SceneResponseDto` | Partial light update |
| `DELETE /scenes/:id/lights/:lightId` | `Roles([User])` + write | 204 | Soft-delete light |
| `POST /scenes/:id/hdri` | `Roles([User])` + write | `SceneResponseDto` | Multipart `.hdr` upload; ≤ 20 MB; plan-gated by `hdriEnabled` |
| `GET /scenes/:id/hdri` | Public | `StreamableFile` or `307` redirect | Returns the HDRI file (S3 → redirect to signed URL; FS → stream) |
| `POST /scenes/:id/thumbnail` | `Roles([User])` + write | `SceneResponseDto` | Save scene thumbnail from `{ thumbnail: "data:image/png;base64,..." }` body |

### `SceneAnnotationsController` — base `/scenes/:sceneId/annotations`

See the [Annotations](#annotations) section above.

### `SceneCommentsController` — base `/scenes/:sceneId/comments`

See the [Comments](#comments) section above.

---

## Cross-references

- [model-3d.md](model-3d.md) — `SceneObjectEntity.modelId` references `model_3d.model_3d`. The list mapper exposes the model's `entryFile` so the client can build the GLTF URL.
- [organizations.md](organizations.md) — workspace/org context. Plan limits resolve through the workspace → org → `OrganizationEntity.planType`. Workspace member checks (`requireMember`, `isWorkspaceEditor`) live on `WorkspaceMemberRepository`.
- [embed.md](embed.md) — `embed_project.scene_id` references `scene.id`. `EmbedService.viewBySceneId` calls `ScenesService.getSceneForEmbed`, which bypasses visibility (the API key + domain whitelist gate access).
- [file-storage.md](file-storage.md) — directory layout for `scenes/<sceneId>/{environment.hdr,thumbnail.png}`, plus the `IFileStorageStrategy` surface (`saveSceneHdri`, `saveSceneThumbnail`, `deleteSceneFiles`, `getFileUrl`). Note: `file-storage.md` currently documents the HDRI as `hdri.hdr`; the implementation writes `environment.hdr`.
