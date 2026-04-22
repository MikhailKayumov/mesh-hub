# STEP-5 — ZIP Support: Backend

**Block:** 1.5 — Multi-file 3D Upload
**Prerequisites:** STEP-0
**Parallel with:** STEP-1/2/3 (fully independent of org/workspace logic)

---

## Goal

Allow uploading `.zip` archives containing GLTF + external assets (textures, buffers).
Extract to the model directory; track the entry-point filename.
Extend file serving to support subdirectory paths (for textures at relative URLs).

---

## 1. New Type: `ExtractedFile`

**File:** `server/src/modules/files/types.ts`

Add:
```ts
export interface ExtractedFile {
  relativePath: string;   // e.g. 'textures/albedo.png', 'scene.gltf'
  buffer: Buffer;
}

export interface IFileStorageStrategy {
  // ... existing methods ...
  save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<string>;
  // Returns the entry filename (the .gltf/.glb file name)
}
```

---

## 2. `FsFileStorageStrategy` — `save3DModelDirectory`

**File:** `server/src/modules/files/strategies/fs.files.strategy.ts`

```ts
public async save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<string> {
  const modelDir = this.get3DModelFilePath(modelId);

  // Validate no path traversal in any relativePath
  for (const f of files) {
    const target = resolve(modelDir, f.relativePath);
    if (!target.startsWith(modelDir + sep)) {
      throw new BadRequestException(`Invalid file path in archive: ${f.relativePath}`);
    }
  }

  // Create all needed subdirectories and write files
  for (const f of files) {
    const target = resolve(modelDir, f.relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, f.buffer);
  }

  const entryFile = files.find(f => /\.(gltf|glb)$/i.test(f.relativePath));
  if (!entryFile) throw new BadRequestException('No .gltf or .glb entry point found in archive');
  return entryFile.relativePath;
}
```

---

## 3. `FilesService` — ZIP Extraction

**File:** `server/src/modules/files/files.service.ts`

Add method `extractAndSave3DModelDirectory`:

```ts
// Install: npm install adm-zip @types/adm-zip  (in server/)
import AdmZip from 'adm-zip';

public async extractAndSave3DModelDirectory(
  modelId: string,
  zipFile: Express.Multer.File,
): Promise<string> {
  const zip = new AdmZip(zipFile.path);
  const entries = zip.getEntries();

  const ALLOWED_EXTENSIONS = new Set([
    '.gltf', '.glb', '.bin',
    '.png', '.jpg', '.jpeg', '.webp', '.ktx2',
    '.mp3', '.ogg', '.wav',
  ]);

  const MAX_UNCOMPRESSED = 1024 ** 3 * 3; // 3 GB
  let totalSize = 0;

  const extractedFiles: ExtractedFile[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const name = entry.entryName;
    const depth = name.split('/').length - 1;
    if (depth > 1) throw new BadRequestException(
      `Archive contains files more than 1 level deep: ${name}`
    );

    const ext = extname(name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) throw new BadRequestException(
      `Archive contains disallowed file type: ${ext}`
    );

    totalSize += entry.header.size;
    if (totalSize > MAX_UNCOMPRESSED) throw new BadRequestException(
      'Archive uncompressed size exceeds 3 GB limit'
    );

    extractedFiles.push({
      relativePath: name,
      buffer: entry.getData(),
    });
  }

  // Validate exactly one entry point
  const entryPoints = extractedFiles.filter(f => /\.(gltf|glb)$/i.test(f.relativePath));
  if (entryPoints.length === 0) throw new BadRequestException('No .gltf or .glb file found in archive');
  if (entryPoints.length > 1) throw new BadRequestException(
    'Archive contains multiple .gltf/.glb files — exactly one required'
  );

  return this.strategy.save3DModelDirectory(modelId, extractedFiles);
}
```

Also add delegation to `FilesService`:
```ts
public async save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<string> {
  return this.strategy.save3DModelDirectory(modelId, files);
}
```

---

## 4. `Model3dFileEntity` — Add `entryFile` Column

**File:** `server/src/database/entities/models-3d/model-3d-file.entity.ts`

Add:
```ts
@Column({ type: 'text', nullable: true, name: 'entry_file' })
public entryFile?: string;
// For native .glb/.gltf: null (entryFile === name)
// For ZIP-extracted: e.g. 'scene.gltf' or 'textures/../scene.gltf'
```

**Migration:** `server/src/database/migrations/models-3d/<timestamp>-AddEntryFile.ts`
```sql
ALTER TABLE "model_3d"."model_3d_file" ADD COLUMN "entry_file" text;
```

---

## 5. Update `ACCEPTED_3D_MODEL_FILE_TYPES`

**File:** `server/src/constants/files.ts`

```ts
export const ACCEPTED_3D_MODEL_FILE_TYPES = ['.gltf', '.glb', '.zip'];
export const MAX_3D_MODEL_FILE_SIZE = 1024 ** 3 * 3; // 3 GB (applies to ZIP too)
```

---

## 6. Update `Model3dService.upload3DModel`

**File:** `server/src/modules/models-3d/services/model-3d.service.ts`

After creating `fileEntity` and `modelEntity`, branch on file extension:

```ts
const isZip = extname(file.originalname).toLowerCase() === '.zip';

if (isZip) {
  const entryFile = await this.filesService.extractAndSave3DModelDirectory(savedModel.id, file);
  // Update fileEntity.name to be the ZIP filename, fileEntity.entryFile to entry point
  fileEntity.entryFile = entryFile;
  await em.save(fileEntity);
  // Cleanup: delete the temp ZIP file
  await this.filesService.deleteFile(file.path);
} else {
  await this.filesService.save3DModel(savedModel.id, file);
}
```

Error cleanup must handle both ZIP temp file and partially extracted directory.

---

## 7. Update `Model3dMapper` / `Model3dResponseDto`

Include `entryFile` in the file DTO so the frontend knows which file to load:
```ts
file: {
  id: entity.file.id,
  name: entity.file.name,
  entryFile: entity.file.entryFile ?? entity.file.name,  // fallback
  size: entity.file.size,
  extension: entity.file.extension,
}
```

---

## 8. File Serving Wildcard Route (already done in STEP-0 Fix 3)

Verify that `GET /models-3d/files/:modelId/*fileName` (from STEP-0) correctly serves:
- `GET /models-3d/files/<modelId>/scene.gltf`
- `GET /models-3d/files/<modelId>/textures/albedo.png`

The wildcard catches subdirectory paths. Path traversal check from STEP-0 is already in place.

---

## Verification

1. Upload a valid ZIP containing `scene.gltf` + `textures/albedo.png` → 201 with `modelId`.
2. `GET /api/models-3d/<modelId>` → `file.entryFile = 'scene.gltf'`.
3. `GET /api/models-3d/files/<modelId>/textures/albedo.png` → 200 with image data.
4. Upload ZIP with `../evil.sh` → 400 Bad Request.
5. Upload ZIP with 2 GLTF files → 400 Bad Request.
6. Upload ZIP > 3 GB uncompressed → 400 Bad Request.
