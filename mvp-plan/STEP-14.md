# STEP-14 — Versions Full Stack

**Block:** 5 — Versioning
**Prerequisites:** STEP-1 (DB), STEP-6 (viewer), STEP-8 (file storage refactor)
**Parallel with:** STEP-12/13 (reviews)

---

## Goal

Track and store multiple file versions of a 3D model. Users can upload a new version,
browse version history, preview any past version, and restore.

---

## 1. File System Layout

```
files/models-3d/<modelId>/
├── <entryFile>                  # current active file (symlink or copy)
├── thumbnail.png                # current thumbnail
└── versions/
    └── <versionId>/
        ├── <filename>           # the actual uploaded GLB/GLTF for this version
        └── thumbnail.png        # snapshot of this version (optional)
```

On version restore: copy `versions/<targetVersionId>/<filename>` to the root and
update `Model3dFileEntity.entryFile` and `Model3dEntity.currentVersionId`.

---

## 2. New Entity

**`server/src/database/entities/models-3d/model-version.entity.ts`**

Columns:
- `versionNumber: number` (integer, not null, default 1)
- `fileName: string` (original uploaded filename)
- `fileSize: number` (bytes)
- `mimeType: string`
- `changeNotes: string` (nullable, max 500 chars — user-supplied release note)
- `isActive: boolean` (default false — only one version is active per model)

Relations:
- `@ManyToOne(() => Model3dEntity)` → `model_id` (required)
- `@ManyToOne(() => UserEntity)` → `uploader_id` (the user who uploaded this version)

Extends `GuidIdEntityBase`. Table: `model_version` (in `model_3d` schema).
Add index on `model_id`.

**Update `Model3dEntity`:**
- Add `@OneToMany(() => ModelVersionEntity)` → `versions`.
- Add `@Column({ nullable: true }) currentVersionId: string` (UUID, FK to `model_version`).

---

## 3. Migration

`<timestamp>-AddModelVersions.ts` in `server/src/database/migrations/models-3d/`:
- Create `model_3d.model_version` table.
- Add `current_version_id` column to `model_3d.model_3d`.
- Backfill: create an initial version record for each existing model with `versionNumber = 1`, `isActive = true`.

---

## 4. Backend — `versions` Module

**Directory:** `server/src/modules/models-3d/versions/` (sub-module, re-exported from `Models3dModule`).

### DTOs

**`version.upload.request.dto.ts`:** `changeNotes?: string` (@IsOptional, @MaxLength(500)).
**`version.response.dto.ts`:**
```ts
{
  id: string,
  versionNumber: number,
  fileName: string,
  fileSize: number,
  changeNotes: string | null,
  isActive: boolean,
  uploader: { id, firstName, lastName, avatar },
  createdAt: string,
}
```

### Repository: `ModelVersionRepository`

Methods:
- `findByModelId(modelId)` — order by `versionNumber DESC`.
- `findActive(modelId)` — `WHERE model_id = ? AND is_active = true`.
- `findById(versionId)`.

### Service: `VersionsService`

**`getVersions(modelId, user)`:**
Verify model exists + user has access. Return ordered list.

**`uploadVersion(modelId, user, file, dto)`:**

**Critical: use pessimistic write lock to prevent race conditions.**

```ts
await this.dataSource.transaction(async (em) => {
  // Lock the model row
  const model = await em.getRepository(Model3dEntity).findOne({
    where: { id: modelId },
    lock: { mode: 'pessimistic_write' },
  });

  // Compute next version number
  const lastVersion = await this.versionRepository.findLastVersion(modelId, em);
  const nextNumber = (lastVersion?.versionNumber ?? 0) + 1;

  // Save file to disk: files/models-3d/<modelId>/versions/<newVersionId>/
  const versionEntity = em.create(ModelVersionEntity, {
    modelId,
    versionNumber: nextNumber,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    changeNotes: dto.changeNotes,
    uploaderId: user.id,
    isActive: false,
  });
  const saved = await em.save(versionEntity);

  // Move file to versioned path
  await this.filesService.saveModelVersion(modelId, saved.id, file);

  return saved;
});
```

**`activateVersion(modelId, versionId, user)`:**

```ts
await this.dataSource.transaction(async (em) => {
  // Pessimistic lock on model
  // Set all versions isActive = false
  // Set target version isActive = true
  // Copy version file to model root (update entryFile)
  // Update model.currentVersionId = versionId
});
```

**`deleteVersion(modelId, versionId, user)`:**
Cannot delete the active version. Soft-delete the entity. Delete the version directory from FS.

### `IFileStorageStrategy` Extensions

Add to the interface and `FsFileStorageStrategy`:
```ts
saveModelVersion(modelId: string, versionId: string, file: Express.Multer.File): Promise<void>
deleteModelVersion(modelId: string, versionId: string): Promise<void>
copyVersionToRoot(modelId: string, versionId: string, fileName: string): Promise<void>
```

### Controller

Prefix: `/models-3d/:modelId/versions`.

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/` | `@Roles([User])` | List versions |
| POST | `/` | `@Roles([User])` | Upload new version (Multer) |
| POST | `/:versionId/activate` | `@Roles([User])` | Restore/activate |
| DELETE | `/:versionId` | `@Roles([User])` | Delete non-active version |

---

## 5. Frontend

### RTK Query

**`client/src/app/api/versions.ts`:**
- `modelVersions` — GET, provides `Versions`.
- `uploadVersion` — POST (FormData), invalidates `Versions`, `CurrentUser3DModel`, `Get3DModel`.
- `activateVersion` — POST `/:id/activate`, invalidates same.
- `deleteVersion` — DELETE, invalidates `Versions`.

### `VersionHistory` Widget

**Directory:** `client/src/widgets/VersionHistory/`

```
VersionHistory/
├── index.tsx
├── VersionHistory.tsx
├── VersionHistory.module.scss
└── components/
    ├── VersionCard.tsx
    └── UploadVersionModal.tsx
```

### `VersionHistory.tsx`

Props: `modelId: string`, `canEdit: boolean`.

- Calls `useModelVersionsQuery`.
- Lists versions newest-first as `VersionCard` items.
- Active version shown with a green badge.
- "Upload new version" button (if `canEdit`) → `UploadVersionModal`.

### `VersionCard.tsx`

Displays: version number, file name, size, uploader name, `changeNotes`, date.
Actions (if `canEdit`):
- "Preview" → navigates to a preview route that loads this specific version in the viewer.
  URL: `/models-3d/:modelId?versionId=<id>`.
- "Restore" (non-active only) → calls `useActivateVersionMutation` with confirm dialog.
- "Delete" (non-active only) → calls `useDeleteVersionMutation` with confirm dialog.

### `UploadVersionModal.tsx`

- `FileInput` accepting `.glb` / `.gltf`.
- `Textarea` for `changeNotes`.
- Submit calls `useUploadVersionMutation`.

### Version Preview in Viewer

In `useViewer` hook, read the `versionId` query param:
```ts
const [searchParams] = useSearchParams();
const versionId = searchParams.get('versionId');
```

If `versionId` is present, load the file from:
```
/api/models-3d/files/<modelId>/versions/<versionId>/<fileName>
```

Add the endpoint `GET /models-3d/files/:modelId/versions/:versionId/:fileName` to the
controller (same path traversal protection as the main file endpoint).

---

## Verification

1. Upload a new version → version list shows v2 as non-active.
2. Activate v2 → model viewer loads new file; v1 still accessible from history.
3. Delete v1 (non-active) → removed from list; activate fails gracefully.
4. Concurrent upload requests → no duplicate version numbers (pessimistic lock).
5. Preview URL with `?versionId=<v1Id>` → loads v1 file.
