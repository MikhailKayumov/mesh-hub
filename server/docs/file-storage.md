# File Storage

## Overview

File storage is abstracted behind an `IFileStorageStrategy` interface. The current implementation (`FsFilesStrategy`) stores files on the local filesystem under `server/files/`. The `FileStorageModule` is a global module — inject `FileStorageService` in any module without additional imports.

---

## Directory Structure

```
server/files/
├── avatars/
│   └── <userId>.<ext>              # e.g., 9e4f1a2b-3c4d.jpg
│                                    # one file per user, overwritten on update
└── models-3d/
    ├── temp/                        # temporary upload location (multer)
    │   └── <originalname>           # cleaned up after processing
    └── <modelId>/                   # one directory per model
        ├── <filename>.<ext>         # the 3D model file (.glb or .gltf)
        └── thumbnail.png            # optional thumbnail (always PNG)
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
  deleteFile(filePath: string): Promise<void>;
}
```

To add a new storage backend (e.g., S3):
1. Create a new class implementing `IFileStorageStrategy`
2. Register it as the strategy provider in `FileStorageModule`
3. No changes needed in controllers or services

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
- There is no CDN or presigned URL support in the current implementation — files are served directly by the NestJS process via `res.sendFile()` / `res.download()`.
