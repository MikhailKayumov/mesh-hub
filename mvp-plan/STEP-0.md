# STEP-0 — Critical Pre-MVP Fixes

**Block:** Pre-MVP
**Prerequisites:** None
**Must complete before:** All other steps

---

## Goal

Fix two existing production bugs and one security vulnerability before any new code is written.

---

## Fix 1 — FS Path: Use `modelId` Instead of `fileEntityId`

### Problem

`model-3d.service.ts` saves files under `files/models-3d/<createdFileEntity.id>/`,
but `Model3dEntity.id` (the model UUID) is the stable identity. When versions are added
(STEP-14), the `file_id` changes but the model persists — the old directory becomes orphaned.

### Files to modify

**`server/src/modules/models-3d/services/model-3d.service.ts`**

In `upload3DModel()`, change the file save call order so the *model* entity is persisted first
(or use a pre-generated UUID), then save the file using `model.id`:

```
// Current (wrong):
const createdFileEntity = await em.save(fileEntity);
await this.filesService.save3DModel(createdFileEntity.id, file);  // uses fileId

// Fixed:
const createdFileEntity = await em.save(fileEntity);
const modelEntity = new Model3dEntity();
modelEntity.user = user;
modelEntity.name = ...;
modelEntity.file = createdFileEntity;
const savedModel = await em.save(modelEntity);
await this.filesService.save3DModel(savedModel.id, file);  // uses modelId
savedModelId = savedModel.id;
```

Change the cleanup block to use `savedModelId` (model id) instead of `savedFileId`.

**`server/src/modules/models-3d/controllers/model-3d.controller.ts`**

`getModels3DFile` and `getModels3DThumbnailFile` already use `:fileId` param —
rename param to `:modelId` in the route and the variable name (no functional change since
both used to refer to fileEntity.id; after STEP-0 they refer to model.id).

**`server/src/modules/files/strategies/fs.files.strategy.ts`**

The internal methods `get3DModelFilePath(id)` and `get3DModelThumbnailFilePath(id)` use
`id` generically — no code change needed, just ensure callers pass `modelId`.

**`server/src/modules/models-3d/services/model-3d.service.ts`** — `delete3DModel()`:

```
// Current:
await this.filesService.delete3DModel(model.file.id, false);

// Fixed:
await this.filesService.delete3DModel(model.id, false);
```

**`server/src/modules/models-3d/services/model-3d.service.ts`** — `save3DModelThumbnailFromBase64()`:

```
// Current:
model.thumbnail = await this.filesService.save3DModelThumbnailFromBase64(model.file.id, thumbnail);

// Fixed:
model.thumbnail = await this.filesService.save3DModelThumbnailFromBase64(model.id, thumbnail);
```

**`client/src/shared/utils/model3d.ts`**

Confirm the file URL is built as:
```ts
`${API_URL}/models-3d/files/${model.id}/${model.file.name}`
// NOT:
`${API_URL}/models-3d/files/${model.file.id}/${model.file.name}`
```

Update all call sites that pass `model.file.id` to `model.id`.

---

## Fix 2 — Migration Bug: `"isVisible"` Column Name

### Problem

Migration `1704720192661-AddVisibility.ts` created the column as `"isVisible"` (camelCase).
TypeORM's snake_case naming strategy maps the entity property `isVisible` to the column
`is_visible`, but the actual column on disk is `"isVisible"`. This mismatch causes silent
failures in WHERE clauses that reference the column directly.

### Files to modify

**`server/src/database/migrations/models-3d/`** — Create new migration file:
`<timestamp>-FixVisibilityColumnAndAddEnum.ts`

Migration `up()`:
```sql
-- 1. Create the enum type
CREATE TYPE model_3d.model_visibility AS ENUM ('public', 'private', 'unlisted');

-- 2. Add new column using the enum (snake_case name)
ALTER TABLE "model_3d"."model_3d"
  ADD COLUMN "visibility" model_3d.model_visibility NOT NULL DEFAULT 'public';

-- 3. Migrate data from old camelCase boolean column
UPDATE "model_3d"."model_3d"
  SET "visibility" = CASE WHEN "isVisible" = true THEN 'public' ELSE 'private' END;

-- 4. Drop the old column (it was created as camelCase, drop with camelCase name)
ALTER TABLE "model_3d"."model_3d" DROP COLUMN "isVisible";
```

Migration `down()`:
```sql
ALTER TABLE "model_3d"."model_3d"
  ADD COLUMN "isVisible" boolean NOT NULL DEFAULT true;
UPDATE "model_3d"."model_3d"
  SET "isVisible" = CASE WHEN "visibility" = 'public' THEN true ELSE false END;
ALTER TABLE "model_3d"."model_3d" DROP COLUMN "visibility";
DROP TYPE model_3d.model_visibility;
```

**`server/src/database/entities/models-3d/model-3d.entity.ts`**

Replace `isVisible: boolean` with:
```ts
@Column({ type: 'enum', enum: ['public', 'private', 'unlisted'],
          enumName: 'model_visibility', default: 'public' })
public visibility: 'public' | 'private' | 'unlisted';
```

Create a `ModelVisibility` enum constant in `server/src/constants/index.ts`:
```ts
export enum ModelVisibility { Public = 'public', Private = 'private', Unlisted = 'unlisted' }
```

**`server/src/modules/models-3d/`** — Update all references to `isVisible` in DTOs,
mappers, repository filter logic, and service visibility checks.

---

## Fix 3 — Path Traversal in File Serving

### Problem

`getModels3DFile(@Param('fileId') fileId, @Param('fileName') fileName)` uses
`join(process.cwd(), 'files', 'models-3d', fileId, fileName)` — `join()` normalizes `.`
but does NOT prevent `../` traversal, and Express will URL-decode before routing.

### Files to modify

**`server/src/modules/models-3d/controllers/model-3d.controller.ts`**

Change `@Get('files/:fileId/:fileName')` to `@Get('files/:modelId/*fileName')` (wildcard
to support subdirectories like `textures/albedo.png` from ZIP uploads in STEP-5).

Add a private helper or inline guard:
```ts
import { resolve, sep } from 'path';
import { ForbiddenException } from '@nestjs/common';

// Inside controller or extracted to a utility:
function safeFilePath(base: string, ...segments: string[]): string {
  const resolved = resolve(base, ...segments);
  if (!resolved.startsWith(base + sep) && resolved !== base) {
    throw new ForbiddenException();
  }
  return resolved;
}
```

Usage in the endpoint:
```ts
@Get('files/:modelId/*fileName')
public getModels3DFile(
  @Param('modelId') modelId: string,
  @Param('fileName') fileName: string,
): StreamableFile {
  const base = resolve(process.cwd(), 'files', 'models-3d', modelId);
  const target = safeFilePath(base, fileName);
  return new StreamableFile(createReadStream(target));
}
```

Apply the same fix to `getModels3DThumbnailFile`.

---

## Verification

1. Upload a `.glb` file; confirm the file appears at `files/models-3d/<model.id>/<filename>`,
   not `files/models-3d/<file-entity-uuid>/<filename>`.
2. Run migration; confirm `\d model_3d.model_3d` shows `visibility` column (not `"isVisible"`).
3. `GET /api/models-3d/files/<modelId>/../../avatars/` should return 403 Forbidden.
4. `npm run lint` in `server/` passes.
