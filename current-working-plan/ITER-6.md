# ITER-6 — Multi-Format Support (FBX / OBJ / DAE / STL)

## Goal

Support all major artistic 3D formats used across Blender, 3ds Max, Unity, and Unreal Engine. No server-side conversion — the browser loads files directly via Three.js loader registry.

## Status: ✅ Done

> **CAD formats (STEP / IGES / IFC)** — post-MVP, separate viewer mode, out of scope here.

---

## Supported Formats

| Format | Loader | Source tools | Notes |
|---|---|---|---|
| **GLB / GLTF** | `GLTFLoader` (existing) | All | Native web format |
| **FBX** | `FBXLoader` | 3ds Max, Maya, Unity, Unreal, Blender | Animations + materials |
| **OBJ + MTL** | `OBJLoader` + `MTLLoader` | All | MTL auto-loaded from same directory |
| **DAE (Collada)** | `ColladaLoader` | Blender, SketchUp, Unity | Includes scene tree |
| **STL** | `STLLoader` | Blender, 3D printing tools | Geometry only, no materials |

Post-MVP: PLY (point clouds), ABC (Alembic VFX), USDZ (AR, see ITER-9).

---

## Backend Changes

### 1. `server/src/constants/files.ts`

```ts
export const ACCEPTED_3D_MODEL_FILE_TYPES = [
  '.glb', '.gltf',
  '.fbx',
  '.obj', '.mtl',
  '.dae',
  '.stl',
  '.zip',  // multi-file bundles for any supported format (entry + textures + materials)
];

export const MODEL_MAX_SIZE_BYTES: Record<string, number> = {
  '.glb':  3 * 1024 ** 3,   // 3 GB
  '.gltf': 3 * 1024 ** 3,
  '.fbx':  3 * 1024 ** 3,
  '.obj':  500 * 1024 ** 2,  // 500 MB
  '.mtl':  10 * 1024 ** 2,   // 10 MB
  '.dae':  1 * 1024 ** 3,    // 1 GB
  '.stl':  500 * 1024 ** 2,
  '.zip':  3 * 1024 ** 3,
};
```

### 2. `FileSizeValidationPipe` — format-aware limit

Use `MODEL_MAX_SIZE_BYTES[ext]` instead of single constant in the pipe.

### 3. DB Migration — `model_3d_file.original_format`

```sql
ALTER TABLE model_3d.model_3d_file
  ADD COLUMN original_format varchar(10) DEFAULT 'glb';
```

Set on upload: `extname(file.originalname).slice(1).toLowerCase()` (e.g. `'fbx'`).

### 4. Multi-file uploads via `.zip` (all formats)

The `.zip` upload path is **format-agnostic** — any of the supported model formats can be bundled with their auxiliary files (textures, materials, .bin buffers). The single zip pipeline handles them all; there is no per-format zip endpoint.

**Per-format entry-file selection rule** (applied by `FilesService.selectEntryFile` after zip extraction to `models-3d/<modelId>/`):

| Entry format | Rule |
|---|---|
| `.gltf` / `.glb` | Exactly one file required; both present together → reject |
| `.fbx` | Exactly one `.fbx` |
| `.dae` | Exactly one `.dae` |
| `.stl` | Exactly one `.stl` |
| `.obj` | 1+ `.obj` allowed; largest by uncompressed byte size wins (ties broken lexicographically) |

Mixed-format archives (more than one entry-point format type) are rejected with HTTP 400.

**Auxiliary files allowed inside the zip** (not entry-points): `.bin, .png, .jpg, .jpeg, .webp, .ktx2, .mp3, .ogg, .wav, .mtl, .tga, .bmp, .tif, .tiff` plus any non-conflicting model files referenced by the entry. The `.mtl` extension is allowed only inside zip — it is rejected as a standalone upload at the controller's accept-list.

**Format-specific notes:**
- **OBJ:** Pack `.obj + .mtl + textures` together; `MTLLoader.setResourcePath` is set to the model's file directory URL (`${API_BASE}/models-3d/files/${modelId}/`) so relative texture paths resolve correctly.
- **FBX:** Binary `.fbx` typically embeds textures and needs no zip; ASCII `.fbx` with external textures benefits from a zip bundle (loader picks them up via `setResourcePath`).
- **DAE / GLTF:** External texture references (in `.dae` or `.gltf` JSON) resolve relative to the entry file's directory after extraction.
- **STL:** Geometry-only — zip is rarely needed but supported for symmetry.

The `entryFile` and the derived `originalFormat` are persisted on `model_3d_file` after extraction.

---

## Frontend — Loader Registry

### 5. `Loader.ts` — format routing

File: `client/src/widgets/Model3DViewer/classes/Loader/Loader.ts`

```ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

type LoadedModel3D = { scene: Object3D; animations: AnimationClip[]; associations?: Map<...> };

export class Loader {
  private static detectFormat(url: string): string {
    return url.split('?')[0].split('.').pop()?.toLowerCase() ?? 'glb';
  }

  public static async load(url: string): Promise<LoadedModel3D> {
    const fmt = Loader.detectFormat(url);
    switch (fmt) {
      case 'fbx':  return Loader.loadFbx(url);
      case 'obj':  return Loader.loadObj(url);
      case 'dae':  return Loader.loadDae(url);
      case 'stl':  return Loader.loadStl(url);
      default:     return Loader.loadGltf(url);  // glb / gltf
    }
  }

  private static async loadFbx(url: string): Promise<LoadedModel3D> {
    const loader = new FBXLoader();
    const group = await new Promise<Group>((res, rej) => loader.load(url, res, undefined, rej));
    return { scene: group, animations: group.animations };
  }

  private static async loadObj(url: string): Promise<LoadedModel3D> {
    // MTL URL is same base path; MTLLoader basePath must be set to model directory URL
    // so relative texture paths (e.g. textures/body.png) resolve correctly.
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1); // e.g. .../models-3d/files/<id>/
    const mtlUrl = url.replace(/\.obj$/i, '.mtl');
    try {
      const mtlLoader = new MTLLoader();
      mtlLoader.setResourcePath(baseUrl);
      const materials = await new Promise<MTLLoader.MaterialCreator>((res, rej) =>
        mtlLoader.load(mtlUrl, res, undefined, rej));
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      const group = await new Promise<Group>((res, rej) => objLoader.load(url, res, undefined, rej));
      return { scene: group, animations: [] };
    } catch {
      // No MTL found — load without materials
      const objLoader = new OBJLoader();
      const group = await new Promise<Group>((res, rej) => objLoader.load(url, res, undefined, rej));
      return { scene: group, animations: [] };
    }
  }

  private static async loadDae(url: string): Promise<LoadedModel3D> {
    const loader = new ColladaLoader();
    const result = await new Promise<any>((res, rej) => loader.load(url, res, undefined, rej));
    return { scene: result.scene, animations: result.scene.animations ?? [] };
  }

  private static async loadStl(url: string): Promise<LoadedModel3D> {
    const loader = new STLLoader();
    const geometry = await new Promise<BufferGeometry>((res, rej) => loader.load(url, res, undefined, rej));
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.1, roughness: 0.8 }));
    const group = new Group();
    group.add(mesh);
    return { scene: group, animations: [] };
  }

  private static async loadGltf(url: string): Promise<LoadedModel3D> {
    const { scene, animations, parser } = await new GLTFLoader().loadAsync(url);
    return { scene, animations, associations: parser.associations };
  }
}
```

### 6. Material fallback

If FBX / DAE model arrives without any materials → apply `MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.8 })` to all meshes via `traverse()`.

### 7. Upload UI

File: `client/src/widgets/...` (upload model modal / dropzone)

- Update `accept` prop:
  ```ts
  accept={['.glb', '.gltf', '.fbx', '.obj', '.dae', '.stl', '.zip']}
  ```
- Format badge colour (exact Mantine color names): `glb`/`gltf` = `"blue"`, `fbx` = `"orange"`, `obj` = `"grape"`, `dae` = `"teal"`, `stl` = `"gray"`
- Show format badge on model card: `originalFormat` from DTO

**Upload progress indicator** (for large files):
- Add Mantine `Progress` component below the Dropzone while upload is in-flight
- Update via `XMLHttpRequest upload.onprogress` or Axios `onUploadProgress` callback
- Only shown when selected file size > 10 MB; hidden after upload completes or errors

**Format tip Alert** (context-aware UX):
- When user drops/selects an `.obj` file, show:
  ```tsx
  <Alert variant="light" color="blue" icon={<IconInfoCircle />} mt="sm">
    Pack your OBJ + MTL + textures into a <strong>.zip</strong> file for full material support.
  </Alert>
  ```
- Alert is conditionally rendered only when `selectedFile.name.endsWith('.obj')`

### 8. Client DTO — `dto.ts`

File: `client/src/app/api/dto.ts`

- `Model3dFileDto` — add `originalFormat?: string`

---

## Acceptance Criteria

- [ ] FBX files with animations load and play correctly
- [ ] OBJ files load; MTL materials applied if `.mtl` exists; `MTLLoader.setResourcePath()` set to model directory URL for texture resolution
- [ ] OBJ zip: largest `.obj` used as entry file if multiple exist; extracted textures accessible via relative URL
- [ ] DAE (Collada) files load with scene hierarchy
- [ ] STL files load with default MeshStandardMaterial
- [ ] Server accepts all formats without 400 validation error
- [ ] Format badge shown on model cards (exact Mantine colors: blue/orange/grape/teal/gray)
- [ ] `Progress` bar shown below dropzone for files > 10 MB; disappears on completion
- [ ] `.obj` file selection shows "Pack into .zip" `Alert`
- [ ] Zip uploads work for **every** format (GLB/GLTF, FBX, OBJ+MTL, DAE, STL) — not only GLTF and OBJ; mixed-format archives rejected with HTTP 400
- [ ] Default material applied to materialless models (FBX/DAE/STL)
