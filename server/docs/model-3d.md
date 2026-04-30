# Models 3D

Single source of truth for everything that lives under the `/models-3d` route prefix on the backend: model CRUD, file storage, versioning, viewer display config (HDRI + lights), per-mesh material overrides with textures, audio attachments, world-space annotations, and threaded comments.

The bulk of the surface lives in `src/modules/models-3d/`, which composes one parent module + four submodules:

- `Models3dModule` — model CRUD + file streaming ([`models-3d.module.ts`](../src/modules/models-3d/models-3d.module.ts))
- `VersionsModule` — `model_version` history ([`versions/versions.module.ts`](../src/modules/models-3d/versions/versions.module.ts))
- `DisplayConfigModule` — viewer settings + per-model lights ([`display-config/display-config.module.ts`](../src/modules/models-3d/display-config/display-config.module.ts))
- `MaterialsModule` — `model_material_override` + texture maps ([`materials/materials.module.ts`](../src/modules/models-3d/materials/materials.module.ts))
- `AudioModule` — `model_audio` tracks ([`audio/audio.module.ts`](../src/modules/models-3d/audio/audio.module.ts))

**Annotations and comments are separate top-level modules**, mounted under the same route prefix:

- `AnnotationsModule` ([`src/modules/annotations/annotations.module.ts`](../src/modules/annotations/annotations.module.ts)) — controller route prefix `models-3d/:modelId/annotations`.
- `ReviewsModule` ([`src/modules/reviews/reviews.module.ts`](../src/modules/reviews/reviews.module.ts)) — controller route prefix `models-3d/:modelId/comments`.

Both are wired in `AppModule` and import `WorkspacesModule` to perform workspace-membership checks for non-public models.

---

## Entities

All nine entities live in [`src/database/entities/models-3d/`](../src/database/entities/models-3d/) and use the `model_3d` schema (`DatabaseSchemas.Models3D`). Every entity extends `GuidIdEntityBase` (UUID PK + `createdAt` / `updatedAt` / `deletedAt`).

| Entity | Table | Key Fields | Relations |
|---|---|---|---|
| `Model3dEntity` | `model_3d` | `name`, `visibility` (`public`/`private`/`unlisted`), `description` (json), `thumbnail`, `workspaceId?`, `currentVersionId?` | `user` (M:1 `UserEntity` ON DELETE CASCADE), `file` (1:1 `Model3dFileEntity` eager + cascade), `versions` (1:M), `categories` (M:M via `model_3d_categories`) |
| `Model3dFileEntity` | `model_3d_file` | `name`, `size` (bigint), `extension`, `entryFile?`, `originalFormat` (default `glb`) | none — joined from `model_3d.file_id` |
| `ModelVersionEntity` | `model_version` | `versionNumber` (int, default 1), `fileName`, `fileSize`, `mimeType`, `entryFile?`, `changeNotes?` (varchar 500), `isActive` (bool) | `model` (M:1, `model_id`, ON DELETE CASCADE), `uploader` (M:1 `UserEntity`, `uploader_id`) |
| `ModelDisplayConfigEntity` | `model_display_config` | `backgroundColor` (default `#000000`), `ambientIntensity` (default 0.5), `environmentHdriPath?`, `fogEnabled`, `fogType` (`linear`/`exp2`), `fogColor`, `fogNear`, `fogFar`, `postProcess` (jsonb), `rendererConfig` (jsonb) | `model` (1:1, **unique** `model_id`, ON DELETE CASCADE) |
| `ModelLightEntity` | `model_light` | `type` (varchar(15)), `posX`/`posY`/`posZ`, `color` (varchar(9)), `intensity`, `castShadow` | `model` (M:1 ON DELETE CASCADE) |
| `ModelMaterialOverrideEntity` | `model_material_override` | `meshName` (varchar(255)), `colorHex?`, `metalness?`, `roughness?`, `emissiveHex?`, `emissiveIntensity?`, `opacity?`, `wireframe`, six `*MapPath?` columns (`textureMap`, `normal`, `roughness`, `metalness`, `emissive`, `ao`) | `model` (M:1 ON DELETE CASCADE). One row per (`modelId`, `meshName`) — see Material Overrides below |
| `ModelAudioEntity` | `model_audio` | `filename` (varchar(255)), `originalName` (varchar(255)), `durationS?` (float8) | `model` (M:1 ON DELETE CASCADE) |
| `ModelAnnotationEntity` | `model_annotation` | `label` (varchar(50)), `body?`, `posX/Y/Z` (world-space), `cameraPosX/Y/Z?` (optional bookmark), `order` (int) | `model` (M:1 ON DELETE CASCADE) |
| `ModelCommentEntity` | `model_comment` | `body` (text), `posX/Y/Z?` (optional pin), `resolved`, `parentId?` (self-ref) | `model` (M:1 ON DELETE CASCADE), `author` (M:1 `UserEntity` eager, ON DELETE CASCADE), `parent` (self-ref ON DELETE SET NULL) |

Schema/table name constants live in [`src/database/constants.ts`](../src/database/constants.ts) under `DatabaseSchemas.Models3D` and `Models3DSchemaTables.*`.

`model_3d_categories` is a M:M join with `resources.category` — declared inline on `Model3dEntity.categories`.

---

## Upload Pipeline

The model upload endpoint is `POST /models-3d/upload` (see [`model-3d.controller.ts:127`](../src/modules/models-3d/controllers/model-3d.controller.ts#L127)). The flow:

```
1. Client → POST /models-3d/upload (multipart/form-data)
   field: file              (required)
   field: workspaceId       (optional UUID — from UploadModel3dRequestDto)

2. FileInterceptor('file', { dest: './files/models-3d/temp' })
   → multer writes the upload to: files/models-3d/temp/<random-name>

3. ParseFilePipe runs the validator chain:
   - FileSizeValidator(MODEL_MAX_SIZE_BYTES, DEFAULT_MAX_3D_MODEL_FILE_SIZE)
       per-extension limit map; on failure deletes file.path
   - FileExtensionValidatorPipe(ACCEPTED_3D_MODEL_FILE_TYPES)
   On validation failure: 400, temp file removed by the pipe.

4. Model3dService.upload3DModel(user, file, workspaceId?)
   a. If workspaceId is set → StorageQuotaService.checkStorageQuotaByWorkspace.
   b. Inside a transaction (model3dRepository.manager.transaction):
      - Create Model3dFileEntity { name, size, extension, originalFormat }
      - Create Model3dEntity   { user, name (basename of file), file, workspaceId? }
      - Save both — DB row now exists, modelId is known.
      - If extension == .zip:
          FilesService.extractAndSave3DModelDirectory(modelId, file)
          → returns { entryFile, format }; saved on the file entity.
          → temp .zip is then deleted via FilesService.deleteFile(file.path).
        Else:
          FilesService.save3DModel(modelId, file)
          → moves files/models-3d/temp/<…> into files/models-3d/<modelId>/<filename>.
   c. On success and if workspaceId set → fire-and-forget
      WebhookDeliveryService.dispatch(orgId, 'model.uploaded', …).

5. On any error: best-effort cleanup
   - if savedModelId set → FilesService.delete3DModel(savedModelId)
   - else                 → FilesService.deleteFile(file.path)
   throws BadRequestException('Не удалось сохранить 3D модель').
```

### Accepted formats and size limits

| Extension | Per-file limit |
|---|---|
| `.glb` | 3 GB |
| `.gltf` | 3 GB |
| `.fbx` | 3 GB |
| `.obj` | 500 MB |
| `.mtl` | 10 MB |
| `.dae` | 1 GB |
| `.stl` | 500 MB |
| `.zip` | 3 GB |

Defined in [`src/constants/models-3d.ts`](../src/constants/models-3d.ts) (`MODEL_MAX_SIZE_BYTES`, `ACCEPTED_3D_MODEL_FILE_TYPES`, `DEFAULT_MAX_3D_MODEL_FILE_SIZE`).

> The accepted-format list has expanded beyond `.glb` / `.gltf`. Older copy in [`file-storage.md`](file-storage.md) and [`modules.md`](modules.md) calls out only those two; this file is canonical.

### Stub storage engine

`src/modules/models-3d/storage-engine/model-3d.storage.engine.ts` defines `Model3DDiskStorage` and `Model3DStorageEngine`, but they are **not wired**. The active uploader is the inline `FileInterceptor('file', { dest: './files/models-3d/temp' })` decorator on the controller methods. The class body in `_handleFile` is commented out.

---

## Thumbnail Pipeline

Thumbnails are uploaded as a base64 data URL — never multipart.

```
1. Client → POST /models-3d/:modelId/save-thumbnail-base64
   Body: { "thumbnail": "data:image/png;base64,<base64>" }

2. Model3dService.save3DModelThumbnailFromBase64(user, modelId, thumbnail)
   - Loads model with file relation, asserts ownership (user_id = current).
   - Calls FilesService.save3DModelThumbnailFromBase64(modelId, thumbnail)
       → strips data-URL prefix, decodes, writes
         files/models-3d/<modelId>/thumbnail.png via the active strategy.
   - Persists model.thumbnail = returned filename.
```

Serving:

- `GET /models-3d/files/:modelId/thumbnail` — `@Public()`, streams `thumbnail.png` with `Cache-Control: max-age=31536000` (1 year). Path traversal is blocked by the controller's `safeResolvePath()` helper.

See [`file-storage.md`](file-storage.md#thumbnail-lifecycle) for the storage-strategy side.

---

## Versions

`ModelVersionEntity` (`model_version` table) holds the file history of a single model. **All versions share the same `model_3d` row** — but each version owns its own files under `files/models-3d/<modelId>/versions/<versionId>/`.

Implementation: [`versions.service.ts`](../src/modules/models-3d/versions/versions.service.ts).

### One-active-at-a-time invariant

Enforced in code, not by a partial unique index. `activateVersion` runs in a transaction:

1. `SELECT … FOR UPDATE` on the `model_3d` row (`pessimistic_write`).
2. `UPDATE model_version SET is_active = false WHERE model_id = :id`.
3. `UPDATE model_version SET is_active = true WHERE id = :versionId`.
4. Update `model_3d_file.entry_file` to the activated version's `entryFile ?? fileName`.
5. Update `model_3d.current_version_id`.

After the DB commit, files from the active version directory are copied to the model root via `FilesService.copyVersionToRoot[ForOrg]`. If that copy fails the DB is **not** rolled back (logged + left consistent — comment in `versions.service.ts:178`).

### Upload flow

`POST /models-3d/:modelId/versions` (owner only):

1. Load model with `user` + `file` relations; assert `model.user.id === user.id`.
2. Resolve `orgId` (from `workspace_id` → `workspaces.workspace.org_id`, or `undefined` for personal models).
3. Begin transaction:
   - Pessimistic write lock on the `model_3d` row.
   - `findLastVersion(modelId)` → next `versionNumber = (last?.versionNumber ?? 0) + 1`.
   - Create `ModelVersionEntity` with `isActive: false`.
4. After commit, save the file:
   - `.zip` → `FilesService.extractAndSaveModelVersionDirectory(modelId, versionId, file, orgId)`; persist resulting `entryFile`.
   - Otherwise → `saveModelVersion[ForOrg](modelId, versionId, file)`.
5. On failure: delete the saved version files, throw a `BadRequestException`.

### Listing

`GET /models-3d/:modelId/versions` (owner only). Re-loads the model; if `model.user.id !== user.id` throws `ForbiddenException('Нет доступа к версиям модели')`.

### Delete

`DELETE /models-3d/:modelId/versions/:versionId` — soft-delete only; **active version cannot be deleted** (`BadRequestException('Нельзя удалить активную версию')`). After soft-delete, version files are removed via `FilesService.deleteModelVersion[ForOrg]`.

### File serving

`GET /models-3d/files/:modelId/versions/:versionId/*splat` — `@Public()`, streams from `files/models-3d/<modelId>/versions/<versionId>/<file>` with `Cache-Control: max-age=2592000` (30 days). For workspace models with S3, redirects (HTTP 307) to a signed URL produced by `IFileStorageStrategy.getFileUrl`.

---

## Display Config

One row per model in `model_display_config`, **unique on `model_id`**. Lazily created — the first `GET` returns a default-populated row if none exists (`createDefault(modelId)` in the repo).

Service: [`display-config.service.ts`](../src/modules/models-3d/display-config/display-config.service.ts).

### Endpoints

All under `models-3d/:modelId/display-config`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Public()` | Read config + lights. Visibility-checked via `loadModelForRead` (public/unlisted = open; private = owner only) |
| PATCH | `/` | `@Roles([User])` | Partial update of `backgroundColor`, `ambientIntensity` (0-10), `fogEnabled`, `fogType` (`linear`/`exp2`), `fogColor`, `fogNear`, `fogFar`, `postProcess` (jsonb), `rendererConfig` (jsonb) — owner only |
| POST | `/hdri` | `@Roles([User])` | Multipart upload of an environment HDRI (max 20 MB). Saved via `FilesService.saveModelDisplayHdri(orgId, modelId, file)`; sets `environmentHdriPath = models-3d/<modelId>/display-hdri.hdr` |
| DELETE | `/hdri` | `@Roles([User])` | Removes the HDRI file and clears `environmentHdriPath` |
| POST | `/lights` | `@Roles([User])` | Add a `model_light` (returns the full DisplayConfig + lights array) |
| PATCH | `/lights/:lightId` | `@Roles([User])` | Partial light update |
| DELETE | `/lights/:lightId` | `@Roles([User])` | Soft-delete a light |

### Update DTO

`DisplayConfigUpdateDto` — every field optional and class-validated:

- `backgroundColor`, `fogColor`: `@IsHexColor()`
- `ambientIntensity`: `@IsNumber() @Min(0) @Max(10)`
- `fogType`: `@IsIn(['linear', 'exp2'])`
- `fogEnabled`: `@IsBoolean()`
- `fogNear`, `fogFar`: `@IsNumber()`
- `postProcess`, `rendererConfig`: `@IsObject()` (free-form jsonb, validated by the client viewer)

The response is always the **full** `DisplayConfigResponseDto`, with `lights` joined in.

---

## Material Overrides

One row per `(modelId, meshName)` in `model_material_override`. Lets the publisher tweak GLTF material parameters and replace texture maps for individual meshes without touching the source asset.

Service: [`materials.service.ts`](../src/modules/models-3d/materials/materials.service.ts).

### Upsert semantics

`PUT /models-3d/:modelId/materials/:meshName`:

1. `loadModel` asserts ownership.
2. `findByModelAndMesh(modelId, meshName)` — if missing, a new row is created in-memory with `wireframe: false`.
3. Each `MaterialOverrideUpsertDto` field is applied only when defined (PATCH-like merge despite the `PUT` verb).
4. Saved through `MaterialOverrideRepository.save`.

`MaterialOverrideUpsertDto` validators: `colorHex` / `emissiveHex` `@IsHexColor()`; `metalness`, `roughness`, `opacity` clamped to `[0, 1]`; `emissiveIntensity` to `[0, 5]`; `wireframe` boolean.

The `:meshName` path segment is `decodeURIComponent`-ed in the controller — the client must percent-encode mesh names that contain `/`, spaces, etc.

### Texture maps

Texture types (`materials.service.ts:15`): `map`, `normal`, `roughness`, `metalness`, `emissive`, `ao`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/:meshName/texture/:type` | `@Roles([User])` | Multipart `file` upload. Validates `≤ 5 MB`, `image/png` / `image/jpeg` / `image/webp`. Saves to `files/models-3d/<modelId>/materials/<overrideId>/<type>.<ext>` via `FilesService.saveModelMaterialTexture`. Persists the resulting path on the matching `*MapPath` column |
| DELETE | `/:meshName/texture/:type` | `@Roles([User])` | Removes the texture file and nulls the column. Returns the updated override |
| GET | `/:meshName/texture/:type` | `@Public()` | Streams the texture file. Resolves `mimeType` from the path extension (`png`/`jpg`/`jpeg`/`webp`) |
| DELETE | `/:meshName` | `@Roles([User])` | Soft-delete the override and best-effort delete all six texture files |
| GET | `/` | `@Public()` | List all overrides for the model |

The full mesh override surface is owner-only writes, public reads.

---

## Audio Attachments

`ModelAudioEntity` (`model_audio` table) attaches uploaded audio tracks to a model. Played in the viewer (positional or non-positional is decided client-side; the server does not persist that flag).

Service: [`audio.service.ts`](../src/modules/models-3d/audio/audio.service.ts).

### Endpoints

Under `models-3d/:modelId/audio`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Roles([User])` | Owner-only list of tracks for a model |
| POST | `/` | `@Roles([User])` | Multipart upload (field `file`). Max 20 MB; MIME must match `^audio/(mpeg|mp3|ogg|wav|x-wav|wave)$`. Creates the row first to allocate an `id`, then saves via `FilesService.saveModelAudio(orgId, modelId, audioId, file)`; the returned filename overwrites `track.filename`. Returns the saved track |
| DELETE | `/:audioId` | `@Roles([User])` | Owner-only soft-delete + file removal |
| GET | `/:audioId/stream` | `@Public()` | Visibility-checked stream/redirect. Public + Unlisted models are open; Private requires owner. S3 strategy returns 302 redirect to a signed URL; FS fallback streams the local file with `Content-Type: audio/mpeg` |

The 20 MB limit and MIME pattern are local constants in `audio.controller.ts:29-30` — not pulled from `src/constants/`.

---

## Lights

`ModelLightEntity` (`model_light` table) is **separate from** `scenes.scene_light`. Lights here belong to a single model and are evaluated by the viewer when displaying that model standalone (e.g. on the model detail page or in the embed). When a model is placed inside a scene, the scene's own lights apply instead.

### Allowed types

`type` is a free-form `varchar(15)` at the DB level, but the upsert DTOs validate against a fixed list:

```
ambient | directional | point | spot
```

(`model-light.upsert.dto.ts:4`).

### Endpoints

Lights are managed through the **DisplayConfig controller** — see the rows above. Each call returns the full `DisplayConfigResponseDto` (config + complete `lights` array), so the UI doesn't need a separate fetch.

Defaults applied on add (when fields are omitted): `posX=0`, `posY=5`, `posZ=5`, `color=#ffffff`, `intensity=1.0`, `castShadow=true`. `intensity` is clamped to `[0, 100]`.

---

## Annotations

3D world-space annotation pins. `ModelAnnotationEntity` (`model_annotation` table). Lives in [`src/modules/annotations/`](../src/modules/annotations/).

Each annotation has a world-space position (`pos.x/y/z`), an optional camera bookmark (`cameraPos.x/y/z`), a short `label` (max 50 chars), an optional rich `body`, and an `order` integer used for the sidebar list.

### Access

All write paths route through `assertCanWrite(model, user)` ([`annotations.service.ts:110`](../src/modules/annotations/services/annotations.service.ts#L110)):

- **Workspace model** → user must be a workspace member with `role === Editor` (`WorkspaceMemberRole.Editor`). Note: the check is strict equality, so members with a different role (Viewer / Admin / Owner — depending on enum) are rejected.
- **Personal model** → must be the model owner.

Reads (`GET /`) are `@Public()` — they only verify the model exists.

### Endpoints

Under `models-3d/:modelId/annotations` ([`annotations.controller.ts`](../src/modules/annotations/controllers/annotations.controller.ts)):

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Public()` | All annotations for the model, ordered by repo |
| POST | `/` | `@Roles([User])` + canWrite | Create annotation (label/body/pos/cameraPos/order) |
| PATCH | `/:id` | `@Roles([User])` + canWrite | Partial update — every field is overwritten via repository merge |
| DELETE | `/:id` | `@Roles([User])` + canWrite | Soft-delete |
| PUT | `/reorder` | `@Roles([User])` + canWrite | Body `{ ids: string[] }` — sets `order = index` for every id in array order. No bulk transaction; runs as parallel `UPDATE`s |

---

## Comments

Threaded review comments. `ModelCommentEntity` (`model_comment` table) has a self-referential `parentId` (`ON DELETE SET NULL`). Lives in [`src/modules/reviews/`](../src/modules/reviews/) — the route is mounted under `models-3d/:modelId/comments`.

Each comment has a body (max 2000 chars), an optional 3D pin position (`posX/Y/Z`), a `resolved` flag, a `parentId?` for replies, and the eagerly-loaded `author` user.

### Access

`assertCanRead(model, user?)` ([`reviews.service.ts:154`](../src/modules/reviews/services/reviews.service.ts#L154)):

- `visibility = Public` → open (no auth).
- Otherwise authentication is required:
  - Workspace model → must be a workspace member (any role).
  - Personal model → must be the owner.

`assertCanModify(comment, user)`:

- Author can always edit / delete their own.
- For workspace models, an `Editor`-role member can also edit / delete (matches the strict equality check used in annotations).

Deleting a parent comment soft-removes all direct children before soft-removing the parent.

### Side effects on `addComment`

Fire-and-forget after persistence ([`reviews.service.ts:69`](../src/modules/reviews/services/reviews.service.ts#L69)):

- In-app notification to the **model owner** (`NotificationTypes.CommentAdded`) when the author isn't the owner.
- For workspace models, a `comment.added` webhook is dispatched via `WebhookDeliveryService.dispatch(orgId, …)`.

### Endpoints

Under `models-3d/:modelId/comments` ([`reviews.controller.ts`](../src/modules/reviews/controllers/reviews.controller.ts)):

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Public()` + canRead | List all comments for a model (flat, with author + parentId) |
| POST | `/` | `@Roles([User])` + canRead | Create a comment or threaded reply (`parentId?`) |
| PATCH | `/:commentId` | `@Roles([User])` + canModify | Update `body` and/or `resolved` |
| DELETE | `/:commentId` | `@Roles([User])` + canModify | Soft-delete; cascades to direct children |

The pin coordinates can only be set on creation — there is no field for them on `CommentUpdateRequestDto`.

---

## Endpoints

Every method across the eight controllers in this domain.

### `Model3dController` — `models-3d`

[`controllers/model-3d.controller.ts`](../src/modules/models-3d/controllers/model-3d.controller.ts)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/current-user` | `@Roles([User])` | Paginated list of own models (with optional filters) |
| GET | `/` | `@Public()` | Paginated list — public models, or workspace-scoped if `workspaceId` filter is provided (members see all visibility levels there, non-members only public) |
| GET | `/:modelId` | `@Public()` | Single model detail (file + user + categories) |
| PATCH | `/:modelId` | global `JwtAuthGuard` (no `@Roles`) | Owner-only update: `name?`, `visibility?`, `description?`, `categories[]?` |
| DELETE | `/:modelId` | `@Roles([User])` | Owner-only delete (model row + file row + files dir; non-soft) |
| POST | `/:modelId/save-thumbnail-base64` | `@Roles([User])` | Body `{ thumbnail: data-url }` → save PNG |
| POST | `/upload` | `@Roles([User])` | Multipart `file` + optional `workspaceId` → creates model |
| GET | `/files/:modelId/thumbnail` | `@Public()` | Streams `thumbnail.png`, 1-year cache |
| GET | `/files/:modelId/versions/:versionId/*splat` | `@Public()` | Streams a version-pinned file (S3 → 307 redirect to signed URL); 30-day cache |
| GET | `/files/:modelId/*splat` | `@Public()` | Streams the active model file (S3 → 307); 30-day cache |

### `VersionsController` — `models-3d/:modelId/versions`

[`versions/versions.controller.ts`](../src/modules/models-3d/versions/versions.controller.ts)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Roles([User])`, owner | List all versions |
| POST | `/` | `@Roles([User])`, owner | Multipart upload of a new version (`changeNotes?` ≤ 500) |
| POST | `/:versionId/activate` | `@Roles([User])`, owner | Set as active; updates model file pointer + copies files to root |
| DELETE | `/:versionId` | `@Roles([User])`, owner | Soft-delete (active version rejected) |

### `DisplayConfigController` — `models-3d/:modelId/display-config`

[`display-config/display-config.controller.ts`](../src/modules/models-3d/display-config/display-config.controller.ts)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Public()`, visibility-gated | Get or lazily create default config + lights |
| PATCH | `/` | `@Roles([User])`, owner | Update viewer config |
| POST | `/hdri` | `@Roles([User])`, owner | Upload environment HDRI (max 20 MB) |
| DELETE | `/hdri` | `@Roles([User])`, owner | Remove HDRI |
| POST | `/lights` | `@Roles([User])`, owner | Add a model-level light |
| PATCH | `/lights/:lightId` | `@Roles([User])`, owner | Update a light |
| DELETE | `/lights/:lightId` | `@Roles([User])`, owner | Soft-delete a light |

### `MaterialsController` — `models-3d/:modelId/materials`

[`materials/materials.controller.ts`](../src/modules/models-3d/materials/materials.controller.ts)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Public()` | List all material overrides for the model |
| PUT | `/:meshName` | `@Roles([User])`, owner | Upsert override values (color/PBR scalars/wireframe) |
| DELETE | `/:meshName` | `@Roles([User])`, owner | Delete override + all six texture files |
| POST | `/:meshName/texture/:type` | `@Roles([User])`, owner | Upload a texture map (≤ 5 MB; png/jpeg/webp) |
| DELETE | `/:meshName/texture/:type` | `@Roles([User])`, owner | Remove a texture map and clear the path column |
| GET | `/:meshName/texture/:type` | `@Public()` | Stream a texture file |

### `AudioController` — `models-3d/:modelId/audio`

[`audio/audio.controller.ts`](../src/modules/models-3d/audio/audio.controller.ts)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Roles([User])`, owner | List audio tracks |
| POST | `/` | `@Roles([User])`, owner | Multipart upload (max 20 MB; mp3/ogg/wav) |
| DELETE | `/:audioId` | `@Roles([User])`, owner | Delete track |
| GET | `/:audioId/stream` | `@Public()`, visibility-gated | Stream / 302 redirect to signed S3 URL |

### `AnnotationsController` — `models-3d/:modelId/annotations`

[`annotations.controller.ts`](../src/modules/annotations/controllers/annotations.controller.ts)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Public()` | List annotations |
| POST | `/` | `@Roles([User])` + canWrite | Create annotation |
| PATCH | `/:id` | `@Roles([User])` + canWrite | Update annotation |
| DELETE | `/:id` | `@Roles([User])` + canWrite | Soft-delete |
| PUT | `/reorder` | `@Roles([User])` + canWrite | Apply array order to `order` columns |

### `ReviewsController` — `models-3d/:modelId/comments`

[`reviews.controller.ts`](../src/modules/reviews/controllers/reviews.controller.ts)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | `@Public()` + canRead | List comments |
| POST | `/` | `@Roles([User])` + canRead | Add comment / reply |
| PATCH | `/:commentId` | `@Roles([User])` + canModify | Update body / resolved |
| DELETE | `/:commentId` | `@Roles([User])` + canModify | Soft-delete (cascades children) |

---

## Visibility & Access

`ModelVisibility` ([`src/constants/models-3d.ts`](../src/constants/models-3d.ts)) has three values:

| Value | Anonymous read | Workspace member read | Non-member authenticated read |
|---|---|---|---|
| `Public` | yes | yes | yes |
| `Unlisted` | yes (audio + display config), gated elsewhere | yes | yes |
| `Private` | no | yes (when in a workspace) | no — owner only for personal |

### Listing semantics (`Model3dController` `find3DModels`)

The `GET /models-3d` query branches on the request shape:

1. `?asCurrent=true` — returns only models owned by the current user.
2. `workspaceId` is set — workspace members see **all** visibility levels for that workspace; non-members get only `Public`.
3. Neither — global feed of `Public` models only.

### Per-row read (`get3DModel`)

`GET /models-3d/:modelId` is `@Public()` and does **not** filter by visibility — any caller who knows the UUID can fetch the metadata. The visibility gate is enforced by downstream endpoints (audio stream, comments, file streaming) and by the client UI. A private workspace model is therefore "obscure" rather than "secret" at the metadata layer; the file streams enforce strategy-level access for S3 storage.

### Ownership / mutation gates

- **Owner-only** (`model.user.id === user.id`) — versions (all writes), audio (all writes), display config writes, materials writes, model PATCH/DELETE.
- **Workspace editor or model owner** — annotations writes, comments edit/delete (when not your own).
- **Annotations writes** specifically require `WorkspaceMemberRole.Editor` (strict equality) on workspace models.

### `@Public()` endpoints in this domain

Comprehensive list:

- `GET /models-3d`
- `GET /models-3d/:modelId`
- `GET /models-3d/files/:modelId/thumbnail`
- `GET /models-3d/files/:modelId/*splat`
- `GET /models-3d/files/:modelId/versions/:versionId/*splat`
- `GET /models-3d/:modelId/display-config` (visibility-gated)
- `GET /models-3d/:modelId/materials`
- `GET /models-3d/:modelId/materials/:meshName/texture/:type`
- `GET /models-3d/:modelId/audio/:audioId/stream` (visibility-gated)
- `GET /models-3d/:modelId/annotations`
- `GET /models-3d/:modelId/comments` (visibility-gated)

All other endpoints fall under the global `JwtAuthGuard` plus the indicated `@Roles(...)`.

---

## Cross-references

- [`file-storage.md`](file-storage.md) — `IFileStorageStrategy`, the `models-3d/<modelId>/...` directory layout, multer + temp-file lifecycle, S3 fallback for workspace models.
- [`auth.md`](auth.md) — global JWT guard, `@Public()` / `@Roles(...)` semantics, cookie-only token transport.
- [`database.md`](database.md) — full schema map (`model_3d` schema appears there alongside the others), base entity classes, soft-delete column.
- [`modules.md`](modules.md) — module-level catalog; this file supersedes the older `Models3dModule`, `VersionsModule`, and `ReviewsModule` entries when they conflict (see the upload formats note above).
- Scenes — `scenes.scene_object` references `model_3d.id` directly. When a model is referenced by a scene, scene-level lights apply in place of `model_light` rows. There is no dedicated `scenes.md` yet; see [`modules.md` ScenesModule section](modules.md#scenesmodule) for the surface.
