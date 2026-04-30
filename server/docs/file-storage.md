# File Storage

## Overview

File storage is abstracted behind an `IFileStorageStrategy` interface with two implementations:

- **`FsFileStorageStrategy`** — default; stores files on the local filesystem under `server/files/`. Used for all org-less and `local`-backend orgs.
- **`S3FileStorageStrategy`** — AWS SDK v3; stores files in a per-organization S3 bucket (or any S3-compatible endpoint, e.g. MinIO).

The active strategy is selected per request via [`FilesService.getStrategyForOrg(orgId)`](../src/modules/files/files.service.ts) based on `org_subscription.storage_backend`. `FilesService` is provided through the global `FileStorageModule` — inject it directly in any module.

---

## Directory Structure

```
server/files/
├── avatars/
│   └── <userId>.<ext>                          # e.g. 9e4f1a2b-3c4d.jpg
│                                                # one file per user, overwritten on update
├── models-3d/
│   ├── temp/                                    # temporary upload location (multer dest)
│   │   └── <originalname>                       # cleaned up after processing
│   └── <modelId>/                               # one directory per model
│       ├── <filename>.<ext>                     # entry file (.glb / .gltf / .fbx / .obj / .dae / .stl)
│       ├── <auxFile>                            # extracted ZIP siblings (.bin, .png, .ktx2, .mtl, ...)
│       ├── thumbnail.png                        # optional thumbnail (always PNG)
│       ├── display-hdri.hdr                     # optional per-model display-config HDRI (max 20 MB)
│       ├── audio/
│       │   └── <audioId>.<ext>                  # model audio tracks (.mp3 / .ogg / .wav, max 20 MB)
│       ├── materials/
│       │   └── <overrideId>/
│       │       └── <type>.<ext>                 # material texture override (baseColor, normal, ...)
│       └── versions/
│           └── <versionId>/                     # version-scoped copy of model files
│               └── ...
├── scenes/
│   └── <sceneId>/
│       ├── environment.hdr                      # optional scene HDRI environment (max 20 MB)
│       └── thumbnail.png                        # optional scene screenshot
└── embed/
    └── <projectId>/
        └── logo<ext>                            # embed project logo (.png / .jpg / .webp)
```

The pre-created top-level folders (`avatars/`, `models-3d/`, `embed/`) are listed in [`ConfigService.fsConfig.folders`](../src/modules/config/config.service.ts) and are created at boot. `scenes/` and the per-model `audio/` / `materials/` / `versions/` subdirectories are created on-demand by the strategy when the first file is written.

---

## File Limits and Allowed Types

### Avatars

| Property | Value |
|---|---|
| Max size | 1 MB |
| Allowed MIME types | `image/png`, `image/jpeg`, `image/gif`, `image/svg+xml`, `image/webp`, `image/avif` |
| Naming | `<userId>.<original extension>` |
| Storage path | `files/avatars/` |

### 3D Models

| Property | Value |
|---|---|
| Per-extension max size | `.glb`/`.gltf`/`.fbx`/`.zip`: 3 GB; `.dae`: 1 GB; `.obj`/`.stl`: 500 MB; `.mtl`: 10 MB (see [src/constants/files.ts](../src/constants/files.ts) → `MODEL_MAX_SIZE_BYTES`) |
| Default fallback max | 3 GB (`DEFAULT_MAX_3D_MODEL_FILE_SIZE`) |
| Allowed extensions | `.glb`, `.gltf`, `.fbx`, `.obj`, `.dae`, `.stl`, `.zip` (`ACCEPTED_3D_MODEL_FILE_TYPES`) |
| Naming | Original filename preserved |
| Storage path | `files/models-3d/<modelId>/` |
| ZIP archive limit | Total uncompressed size ≤ 3 GB; entries at most 1 directory deep |

### Model Thumbnails

| Property | Value |
|---|---|
| Format | PNG (converted from base64) — no incoming size limit (server-decoded) |
| Naming | Always `thumbnail.png` |
| Storage path | `files/models-3d/<modelId>/thumbnail.png` |
| Endpoint | `POST /models-3d/:modelId/save-thumbnail-base64` |

### Scene HDRI

| Property | Value |
|---|---|
| Max size | 20 MB (`HDRI_MAX_SIZE_BYTES` in [scenes.controller.ts](../src/modules/scenes/controllers/scenes.controller.ts)) |
| Allowed extensions | `.hdr` |
| Naming | Always `environment.hdr` |
| Storage path | `files/scenes/<sceneId>/environment.hdr` |

### Scene Thumbnails

| Property | Value |
|---|---|
| Format | PNG buffer |
| Naming | Always `thumbnail.png` |
| Storage path | `files/scenes/<sceneId>/thumbnail.png` |

### Model Display HDRI

| Property | Value |
|---|---|
| Max size | 20 MB (`MAX_HDRI_SIZE` in [display-config.controller.ts](../src/modules/models-3d/display-config/display-config.controller.ts)) |
| Allowed extensions | `.hdr` |
| Naming | Always `display-hdri.hdr` |
| Storage path | `files/models-3d/<modelId>/display-hdri.hdr` |

### Model Material Texture Overrides

| Property | Value |
|---|---|
| Allowed extensions | `.png`, `.jpg`, `.jpeg`, `.webp` |
| Naming | `<type>.<ext>` (e.g. `baseColor.png`, `normal.webp`) |
| Storage path | `files/models-3d/<modelId>/materials/<overrideId>/<type>.<ext>` |

### Model Audio

| Property | Value |
|---|---|
| Max size | 20 MB (`MAX_AUDIO_SIZE` in [audio.controller.ts](../src/modules/models-3d/audio/audio.controller.ts)) |
| Allowed extensions | `.mp3`, `.ogg`, `.wav` (default `.mp3` if missing) |
| Naming | `<audioId>.<ext>` |
| Storage path | `files/models-3d/<modelId>/audio/<audioId>.<ext>` |

### Model Versions

| Property | Value |
|---|---|
| Files | Same shape as the model root directory (entry file + auxiliaries) |
| Storage path | `files/models-3d/<modelId>/versions/<versionId>/...` |
| Activation | `copyVersionToRoot()` copies a version's files back over the model root |

### Embed Logos

| Property | Value |
|---|---|
| Max size | **Not enforced in the controller.** [embed.controller.ts](../src/modules/embed/controllers/embed.controller.ts) uses bare `FileInterceptor('file')` with no `ParseFilePipe`/`FileSizeValidator`. Any product-stated 1 MB limit is enforced only by the client. |
| Allowed MIME types | Not enforced server-side (no `FileTypeValidator`). |
| Naming | Always `logo<original extension>` (one logo per project; new uploads overwrite) |
| Storage path | `files/embed/<projectId>/logo<ext>` |

---

## Avatar Lifecycle

```
1. Client uploads via POST /user/current/avatar (multipart, field: avatar)
   │
2. FileSizeValidatorPipe checks size ≤ 1 MB
   FileTypeValidatorPipe checks MIME type against whitelist
   (on validation failure: temp file deleted, 400 returned)
   │
3. FilesService.saveAvatar(userId, file)
   │  - Builds destination: files/avatars/<userId>.<ext>
   │  - Writes file to disk (overwrites existing)
   │
4. UserService stores the filename in UserMetaEntity.avatar
   │  - Previous avatar file deleted from disk
   │
5. GET /user/avatar/:fileName (Public, cached)
   - Serves file from files/avatars/<fileName>
```

---

## 3D Model File Lifecycle

```
1. Client uploads via POST /models-3d/upload (multipart, field: file, body: workspaceId?)
   │
2. ParseFilePipe runs:
     - FileSizeValidator (per-extension MODEL_MAX_SIZE_BYTES, default 3 GB)
     - FileExtensionValidatorPipe (.glb/.gltf/.fbx/.obj/.dae/.stl/.zip)
   (on failure: temp file is left for cleanup; 400 returned)
   │
3. Multer saves to temp location: files/models-3d/temp/<originalname>
   │
4. Model3dService.upload3DModel(user, file, workspaceId?)
   │  - Creates the Model3dEntity row
   │  a. For .zip: FilesService.extractAndSave3DModelDirectory(modelId, file)
   │     - Validates entries, picks the entry file, writes to files/models-3d/<modelId>/
   │  b. For single-file uploads: FilesService.save3DModel(modelId, file)
   │     - Creates directory and renames the temp file into it
   │
5. GET /models-3d/files/:modelId/*splat (Public)
   - For workspace-owned models on S3 backend: 307 redirect to a presigned URL
   - Otherwise: streams files/models-3d/<modelId>/<...>
   - Same pattern for /models-3d/files/:modelId/versions/:versionId/*splat

6. DELETE /models-3d/:modelId
   - FilesService.delete3DModel(modelId) (currently always local FS)
   - Recursively deletes: files/models-3d/<modelId>/
```

---

## Thumbnail Lifecycle

```
1. Client sends POST /models-3d/:modelId/save-thumbnail-base64
   Body: { "thumbnail": "data:image/png;base64,<base64data>" }
   │
2. Model3dService.save3DModelThumbnailFromBase64(user, modelId, thumbnail)
   │
3. FilesService.save3DModelThumbnailFromBase64(modelId, base64string)
   │  - Strips the `data:image/png;base64,` prefix
   │  - Decodes base64 → Buffer
   │  - Writes files/models-3d/<modelId>/thumbnail.png (FS) or
   │    PutObject models-3d/<modelId>/thumbnail.png (S3)
   │  - Returns 'thumbnail.png'
   │
4. Updates Model3dEntity.thumbnail = 'thumbnail.png'
```

> Note: the local `FilesService` always routes thumbnail save through the local FS strategy ([files.service.ts:69](../src/modules/files/files.service.ts#L69)) — there is no per-org dispatch for this method today.

---

## IFileStorageStrategy Interface

[`src/modules/files/types.ts`](../src/modules/files/types.ts)

```typescript
interface IFileStorageStrategy {
  init?(): void | Promise<void>;
  deleteFile(path: string, silent: boolean): Promise<void>;
  saveAvatar(name: string, file: Express.Multer.File): Promise<string>;
  removeAvatar(name: string): Promise<void>;
  save3DModel(id: string, file: Express.Multer.File): Promise<string>;
  save3DModelThumbnailFromBase64(id: string, thumbnail: string): Promise<string>;
  delete3DModel(id: string, silent: boolean): Promise<void>;
  save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<void>;
  saveEmbedLogo(projectId: string, file: Express.Multer.File): Promise<string>;
  /** FS strategy returns null (served locally); S3 strategy returns a presigned URL. */
  getFileUrl(relativePath: string): Promise<string | null>;
  saveModelVersion(modelId: string, versionId: string, file: Express.Multer.File): Promise<void>;
  saveModelVersionDirectory(modelId: string, versionId: string, files: ExtractedFile[]): Promise<void>;
  deleteModelVersion(modelId: string, versionId: string): Promise<void>;
  copyVersionToRoot(modelId: string, versionId: string, entryFile: string | undefined): Promise<void>;
  saveSceneHdri(sceneId: string, file: Express.Multer.File): Promise<void>;
  saveSceneThumbnail(sceneId: string, buffer: Buffer): Promise<void>;
  deleteSceneFiles(sceneId: string): Promise<void>;
  saveModelDisplayHdri(modelId: string, file: Express.Multer.File): Promise<void>;
  deleteModelDisplayHdri(modelId: string): Promise<void>;
  saveModelMaterialTexture(modelId: string, overrideId: string, type: string, file: Express.Multer.File): Promise<void>;
  deleteModelMaterialTexture(modelId: string, overrideId: string, type: string): Promise<void>;
  saveModelAudio(modelId: string, audioId: string, file: Express.Multer.File): Promise<string>;
  deleteModelAudio(modelId: string, filename: string): Promise<void>;
}
```

Both [`FsFileStorageStrategy`](../src/modules/files/strategies/fs.files.strategy.ts) and [`S3FileStorageStrategy`](../src/modules/files/strategies/s3.files.strategy.ts) implement this interface in full. To add a new backend:

1. Create a new class implementing `IFileStorageStrategy`.
2. Wire it into `FilesService.getStrategyForOrg` behind a new `StorageBackend` enum value.
3. Add a migration column / env wiring for any new credentials.
4. No changes needed in controllers — they call `FilesService` only.

---

## S3 Strategy

[`src/modules/files/strategies/s3.files.strategy.ts`](../src/modules/files/strategies/s3.files.strategy.ts)

### Per-org selection

`FilesService.getStrategyForOrg(orgId)` reads [`org_subscription.storage_backend`](../src/database/entities/organizations/org-subscription.entity.ts) (enum `local` | `s3`) for the org. When the value is `s3` and `storage_config_encrypted` is set, the row's encrypted JSON blob is decrypted and an `S3FileStorageStrategy` is constructed for that request. Otherwise the shared local strategy is returned.

Methods that accept an `orgId` (scenes, model display HDRI, audio, material textures, model versions) dispatch through `getStrategyForOrg`. Methods without an `orgId` parameter (avatars, model thumbnails, embed logos, the legacy `save3DModel*` shortcuts) currently always go to the local strategy — see the [`FilesService` source](../src/modules/files/files.service.ts).

### Encryption

Per-org S3 credentials are stored in `org_subscription.storage_config_encrypted` as an AES-256-CBC ciphertext in the format `<ivHex>:<ciphertextHex>`. Helpers live in [`src/utils/encryption.ts`](../src/utils/encryption.ts) (`encryptAes256` / `decryptAes256`).

The encryption key is read from the `STORAGE_ENCRYPTION_KEY` env var via [`ConfigService.storageEncryptionKey`](../src/modules/config/config.service.ts) — it must be a 32-byte (64 hex characters) value. A bad/missing key causes `getStrategyForOrg` to throw `InternalServerErrorException('File storage configuration error')`.

The decrypted JSON conforms to `S3StorageConfig`:

```typescript
interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // optional, for MinIO and other S3-compatible backends
}
```

When `endpoint` is set, the SDK is configured with `forcePathStyle: true`.

### Key layout

S3 object keys mirror the local FS layout exactly — e.g. `models-3d/<modelId>/<filename>`, `scenes/<sceneId>/environment.hdr`, `embed/<projectId>/logo<ext>`. This means a single relative path can resolve against either backend.

### Streaming and presigned URLs

For binary streaming routes the S3 strategy does **not** stream through the API. Instead, the controller asks the strategy for `getFileUrl(relativePath)` — the S3 implementation returns a presigned `GetObject` URL with `PRESIGNED_URL_TTL_SECONDS = 3600` (1 h) — and issues an HTTP **307** redirect:

| Route | Redirect call site |
|---|---|
| `GET /models-3d/files/:modelId/*splat` | [model-3d.controller.ts:219](../src/modules/models-3d/controllers/model-3d.controller.ts#L219) |
| `GET /models-3d/files/:modelId/versions/:versionId/*splat` | [model-3d.controller.ts:192](../src/modules/models-3d/controllers/model-3d.controller.ts#L192) |
| Scene HDRI download | [scenes.controller.ts:234](../src/modules/scenes/controllers/scenes.controller.ts#L234) (`HttpStatus.TEMPORARY_REDIRECT`) |
| Model audio download | [audio.controller.ts:91](../src/modules/models-3d/audio/audio.controller.ts#L91) (`HttpStatus.FOUND`) |

The local strategy returns the relative path unchanged from `getFileUrl`, so controllers fall through to the streaming branch.

### Uploads

Multi-megabyte uploads (`save3DModel`, `saveModelVersion`, `saveSceneHdri`, `saveModelDisplayHdri`, `saveModelMaterialTexture`, `saveModelAudio`) use `@aws-sdk/lib-storage`'s `Upload` for multipart uploads from either the multer temp file (`createReadStream(file.path)`) or `file.buffer`. Smaller writes (avatars, thumbnails, embed logo, ZIP-extracted entries) use a single `PutObjectCommand`.

### Deletes

Per-model and per-scene deletes use `ListObjectsV2 + DeleteObjects` paginated by `ContinuationToken` to wipe a whole prefix. Single-key deletes (avatars, display HDRI, audio tracks, material textures) call `DeleteObjectCommand` directly and swallow errors when `silent = true`.

---

## FilesService Methods

[`src/modules/files/files.service.ts`](../src/modules/files/files.service.ts) — **`FilesService`** (the module exports this name; older docs may say `FileStorageService`).

`*ForOrg` variants resolve the strategy via `getStrategyForOrg(orgId)`. Plain variants always use the local FS strategy.

| Method | Routes via | Description |
|---|---|---|
| `getStrategyForOrg(orgId)` | — | Returns the per-org strategy (local or S3) based on `org_subscription.storage_backend` |
| `deleteFile(path, silent?)` | local only | Generic deletion; errors swallowed when `silent` |
| `saveAvatar(name, file)` | local only | Writes `avatars/<name><ext>`; returns the filename |
| `removeAvatar(name)` | local only | Deletes the avatar file |
| `save3DModel(id, file)` | local only | Moves a multer temp file into the model directory |
| `save3DModelDirectory(modelId, files)` | local only | Writes ZIP-extracted entries to the model directory |
| `extractAndSave3DModelDirectory(modelId, zip)` | local only | Validates + extracts a ZIP, picks the entry file, calls the directory writer |
| `save3DModelThumbnailFromBase64(id, base64)` | local only | Decodes data-URL PNG, writes `thumbnail.png`; returns `'thumbnail.png'` |
| `delete3DModel(id, silent?)` | local only | Recursively deletes the model directory |
| `saveEmbedLogo(projectId, file)` | local only | Writes `embed/<projectId>/logo<ext>`; returns the relative path |
| `saveModelVersion[ForOrg](orgId?, modelId, versionId, file)` | per-org | Saves a single file under `models-3d/<modelId>/versions/<versionId>/` |
| `saveModelVersionDirectory[ForOrg](orgId?, modelId, versionId, files)` | per-org | Writes ZIP-extracted entries into the version directory |
| `extractAndSaveModelVersionDirectory(modelId, versionId, zip, orgId?)` | per-org | Wraps extraction + entry-file selection for a version |
| `deleteModelVersion[ForOrg](orgId?, modelId, versionId)` | per-org | Recursively deletes a version directory |
| `copyVersionToRoot[ForOrg](orgId?, modelId, versionId, entryFile?)` | per-org | Promotes a version's files back to the model root (used on activation) |
| `saveSceneHdri(orgId, sceneId, file)` | per-org | Writes `scenes/<sceneId>/environment.hdr` |
| `saveSceneThumbnail(orgId, sceneId, buffer)` | per-org | Writes `scenes/<sceneId>/thumbnail.png` from a `Buffer` |
| `deleteSceneFiles(orgId \| null, sceneId)` | per-org | Recursively deletes the scene directory |
| `getSceneHdriUrl(orgId, sceneId)` | per-org | Resolves to a presigned URL (S3) or `null` (local) |
| `saveModelDisplayHdri(orgId \| null, modelId, file)` | per-org | Writes `models-3d/<modelId>/display-hdri.hdr` |
| `deleteModelDisplayHdri(orgId \| null, modelId)` | per-org | Removes the display HDRI |
| `getModelDisplayHdriUrl(orgId \| null, modelId)` | per-org | Presigned URL or `null` |
| `saveModelMaterialTexture(orgId \| null, modelId, overrideId, type, file)` | per-org | Writes `materials/<overrideId>/<type>.<ext>` |
| `deleteModelMaterialTexture(orgId \| null, modelId, overrideId, type)` | per-org | Deletes all extension variants of `<type>` |
| `saveModelAudio(orgId \| null, modelId, audioId, file)` | per-org | Writes `audio/<audioId>.<ext>`; returns the filename |
| `deleteModelAudio(orgId \| null, modelId, filename)` | per-org | Deletes a single audio track |
| `getModelAudioUrl(orgId \| null, modelId, filename)` | per-org | Presigned URL or `null` |

---

## Upload Validation Pipes

Pipes in `src/pipes/` validate uploaded files before they reach the service. On failure, they delete the temp file to prevent disk leaks.

| Pipe | Validates |
|---|---|
| `FileSizeValidatorPipe` | File size ≤ configured maximum |
| `FileTypeValidatorPipe` | MIME type in allowed list |
| `FileExtensionValidatorPipe` | File extension in allowed list |

---

## Multer Configuration

### Avatar upload
- Multer is configured inline in the user controller
- Destination: OS temp directory (validated and moved by `FilesService`)
- No destination restriction — validation happens in pipes

### 3D model upload
- Custom multer storage engine: [`src/modules/models-3d/storage-engine/model-3d.storage.engine.ts`](../src/modules/models-3d/storage-engine/model-3d.storage.engine.ts)
- Initial destination: `files/models-3d/temp/`
- After service processing: moved to `files/models-3d/<modelId>/`
- HDRI / audio uploads use stock `FileInterceptor` with `dest: './files/models-3d/temp'`

---

## Notes

- The local FS root is `process.cwd()/files`, with pre-created subfolders defined by [`ConfigService.fsConfig`](../src/modules/config/config.service.ts).
- When deploying with Docker, the `files/` directory should be mounted as a volume to persist local-backend data across container restarts.
- For S3-backend orgs, all binaries live in the org's bucket; the API only proxies metadata and emits 307 redirects to presigned URLs for downloads.
- There is no CDN in local mode — files are served directly by the NestJS process via `StreamableFile`/`createReadStream`.
- `STORAGE_ENCRYPTION_KEY` (32-byte hex) is required at boot for any org configured with `storage_backend = 's3'`. Mismatch or absence yields a 500 from the dispatch path.
