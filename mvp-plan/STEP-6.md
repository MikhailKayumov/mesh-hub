# STEP-6 — ZIP Support: Frontend

**Block:** 1.5 — Multi-file 3D Upload
**Prerequisites:** STEP-5 (backend), STEP-0 (modelId-based URLs)
**Parallel with:** STEP-4 (org frontend)

---

## Goal

Update the upload modal to accept `.zip` files and ensure the 3D loader uses
the `entryFile` field for loading, so GLTF external assets resolve correctly.

---

## 1. `Upload3DModelModal` — Accept `.zip`

**File:** `client/src/widgets/Upload3DModelModal/` (find the file input or dropzone)

Update the `accept` prop:
```ts
// Before:
accept: ['.gltf', '.glb']

// After:
accept: ['.gltf', '.glb', '.zip']
```

Add a helper note in the UI: "ZIP archives must contain exactly one .gltf or .glb file."

---

## 2. `getModel3DFileSrc` Utility

**File:** `client/src/shared/utils/model3d.ts` (or wherever this util lives)

Update to use `modelId` (from STEP-0) and `entryFile`:

```ts
export function getModel3DFileSrc(
  modelId: string,
  entryFile: string,
): string {
  return `${MODEL_3D_PATH_PREFIX}/${modelId}/${entryFile}`;
}
```

All call sites that pass `model.file.id` must be updated to `model.id`.
All call sites that pass `model.file.name` must be updated to `model.file.entryFile`.

---

## 3. DTO Types

**File:** `client/src/app/api/dto.ts` (or `new_dto.ts` — whichever has `Model3DFileDto`)

Add `entryFile: string` to `Model3DFileDto`:
```ts
export interface Model3DFileDto {
  id: string;
  name: string;
  entryFile: string;  // ← add
  size: number;
  extension: string;
}
```

---

## 4. `Viewer.ts` — Use `entryFile`

**File:** `client/src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`

In `loadModel(modelData)`:
```ts
// Before:
const src = getModel3DFileSrc(modelData.file.id, modelData.file.name);

// After:
const src = getModel3DFileSrc(modelData.id, modelData.file.entryFile);
```

`GLTFLoader` resolves all relative texture/buffer paths against the base URL of the
`.gltf` file automatically — no further changes needed.

---

## Verification

1. Upload a ZIP file via the modal; no error in the UI.
2. After upload, navigate to the model viewer — `.gltf` model loads with textures visible.
3. `npm run tscheck` passes.
