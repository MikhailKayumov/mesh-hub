# File Storage

## Overview

File storage is abstracted behind an `IFileStorageStrategy` interface with two implementations:

- **`FsFileStorageStrategy`** — default; stores files on the local filesystem under `server/files/`.
- **`S3FileStorageStrategy`** — AWS S3 SDK v3; stores files in a per-organization S3 bucket.

The active strategy is selected at runtime via `FilesService.getStrategyForOrg(orgId)`. The `FileStorageModule` is a global module — inject `FileStorageService` in any module without additional imports.

---

## Directory Structure

```
server/files/
├── avatars/
│   └── <userId>.<ext>              # e.g., 9e4f1a2b-3c4d.jpg
│                                    # one file per user, overwritten on update
├── models-3d/
│   ├── temp/                        # temporary upload location (multer)
│   │   └── <originalname>           # cleaned up after processing
│   └── <modelId>/                   # one directory per model
│       ├── <filename>.<ext>         # the 3D model file (.glb or .gltf)
│       └── thumbnail.png            # optional thumbnail (always PNG)
├── scenes/
│   └── <sceneId>/
│       ├── hdri.hdr                 # optional HDRI environment map (max 20 MB)
│       └── thumbnail.png            # optional scene screenshot
└── embed/
    └── logos/
        └── <projectId>.<ext>        # embed project logo (max 1 MB)
```

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
| Max size | 3 GB |
| Allowed extensions | `.glb`, `.gltf` |
| Naming | Original filename preserved |
| Storage path | `files/models-3d/<modelId>/` |

### Thumbnails

| Property | Value |
|---|---|
| Format | PNG (converted from base64) |
| Naming | Always `thumbnail.png` |
| Storage path | `files/models-3d/<modelId>/thumbnail.png` |

### Scene HDRI

| Property | Value |
|---|---|
| Max size | 20 MB |
| Allowed extensions | `.hdr` |
| Naming | Always `hdri.hdr` |
| Storage path | `files/scenes/<sceneId>/hdri.hdr` |

### Scene Thumbnails

| Property | Value |
|---|---|
| Format | PNG (converted from base64) |
| Naming | Always `thumbnail.png` |
| Storage path | `files/scenes/<sceneId>/thumbnail.png` |

### Embed Logos

| Property | Value |
|---|---|
| Max size | 1 MB |
| Allowed MIME types | `image/png`, `image/jpeg`, `image/webp` |
| Naming | `<projectId>.<original extension>` |
| Storage path | `files/embed/logos/` |

---

## Avatar Lifecycle

```
1. Client uploads via POST /user/current/avatar (multipart, field: avatar)
   │
2. FileSizeValidatorPipe checks size ≤ 1 MB
   FileTypeValidatorPipe checks MIME type against whitelist
   (on validation failure: temp file deleted, 400 returned)
   │
3. FileStorageService.saveAvatar(userId, file)
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
1. Client creates a model (no file yet) → POST /models-3d (not shown; model created on first file upload or separately)

2. Client uploads via POST /models-3d/:modelId/file (multipart, field: file)
   │
3. FileExtensionValidatorPipe checks extension is .glb or .gltf
   FileSizeValidatorPipe checks size ≤ 3 GB
   (on validation failure: temp file deleted, 400 returned)
   │
4. Multer saves to temp location: files/models-3d/temp/<originalname>
   │
5. Model3dService.upload3DModel(modelId, file)
   │  In a transaction:
   │  a. FileStorageService.save3DModel(modelId, tempPath, filename)
   │     - Creates directory: files/models-3d/<modelId>/
   │     - Moves file from temp to files/models-3d/<modelId>/<filename>
   │  b. Creates / updates Model3dFileEntity (name, size, extension)
   │  c. Links file entity to model via Model3dEntity.file_id
   │
6. GET /models-3d/:modelId/file (Public)
   - Streams file from files/models-3d/<modelId>/<filename>

7. DELETE /models-3d/:modelId
   - FileStorageService.delete3DModel(modelId)
   - Recursively deletes: files/models-3d/<modelId>/
```

---

## Thumbnail Lifecycle

```
1. Client sends POST /models-3d/:modelId/thumbnail
   Body: { "thumbnail": "data:image/png;base64,<base64data>" }
   │
2. Model3dService.update3DModel() (thumbnail path)
   │
3. FileStorageService.save3DModelThumbnailFromBase64(modelId, base64string)
   │  - Strips the data URL prefix
   │  - Converts base64 to Buffer
   │  - Writes to files/models-3d/<modelId>/thumbnail.png
   │
4. Updates Model3dEntity.thumbnail = 'thumbnail.png'
```

---

## IFileStorageStrategy Interface

`src/modules/files/types.ts`

```typescript
interface IFileStorageStrategy {
  saveAvatar(userId: string, file: Express.Multer.File): Promise<string>;
  removeAvatar(fileName: string): Promise<void>;
  save3DModel(modelId: string, tempPath: string, fileName: string): Promise<void>;
  save3DModelThumbnailFromBase64(modelId: string, base64: string): Promise<void>;
  delete3DModel(modelId: string): Promise<void>;
  saveSceneHdri(sceneId: string, file: Express.Multer.File): Promise<string>;
  saveSceneThumbnail(sceneId: string, base64: string): Promise<void>;
  deleteScene(sceneId: string): Promise<void>;
  saveEmbedLogo(projectId: string, file: Express.Multer.File): Promise<string>;
  removeEmbedLogo(projectId: string, fileName: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
}
```

To add a new storage backend:
1. Create a new class implementing `IFileStorageStrategy`
2. Register it as the strategy provider in `FileStorageModule`
3. No changes needed in controllers or services

---

## S3 Strategy

`src/modules/files/strategies/s3-file-storage.strategy.ts`

- Uses AWS SDK v3 (`@aws-sdk/client-s3`).
- S3 credentials and bucket config are stored in `org_subscription.s3_config` as an AES-256-CBC encrypted JSON blob.
- `OrgSubscriptionService.getDecryptedS3Config(orgId)` decrypts the config at runtime.
- Files are stored under the same key structure as the local filesystem (e.g., `models-3d/<modelId>/<filename>`).
- Public file serving goes through signed URLs or a proxy endpoint.

---

## FileStorageService Methods

`src/modules/files/files.service.ts`

| Method | Description |
|---|---|
| `saveAvatar(userId, file)` | Saves the avatar file; returns the stored filename |
| `removeAvatar(fileName)` | Deletes the avatar file |
| `save3DModel(modelId, tempPath, fileName)` | Moves model file from temp to model directory |
| `save3DModelThumbnailFromBase64(modelId, base64)` | Saves thumbnail PNG from base64 string |
| `delete3DModel(modelId)` | Recursively deletes the entire model directory |
| `saveSceneHdri(sceneId, file)` | Saves HDRI file for a scene; returns stored path |
| `saveSceneThumbnail(sceneId, base64)` | Saves scene thumbnail PNG from base64 |
| `deleteScene(sceneId)` | Recursively deletes the entire scene directory |
| `saveEmbedLogo(projectId, file)` | Saves embed project logo; returns stored filename |
| `removeEmbedLogo(projectId, fileName)` | Deletes embed logo file |
| `getStrategyForOrg(orgId)` | Returns the correct strategy (local or S3) for an org |
| `deleteFile(path)` | Generic file deletion (errors silently caught) |

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
- Destination: OS temp directory (validated and moved by `FileStorageService`)
- No destination restriction — validation happens in pipes

### 3D model upload
- Custom multer storage engine: `src/modules/models-3d/storage-engine/model-3d.storage.engine.ts`
- Initial destination: `files/models-3d/temp/`
- After service processing: moved to `files/models-3d/<modelId>/`

---

## Notes

- File storage root is determined by `ConfigService` (defaults to `server/files/` relative to process working directory).
- When deploying with Docker, the `files/` directory should be mounted as a volume to persist data across container restarts.
- In S3 mode, files are stored in the org's S3 bucket. File serving is handled via signed URLs or proxy endpoints in the respective controllers.
- There is no CDN support in local mode — files are served directly by the NestJS process via `res.sendFile()` / `res.download()`.
