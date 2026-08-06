---
name: add-3d-loader
description: Use when adding a new file format loader (FBX, OBJ, DAE/Collada, STL, etc.) to the MeshHub 3D viewer. Registers the loader in `Loader.ts`, dispatches by extension, normalises the loaded result into `LoadedModel3D`, and updates upload validation.
---

# Add a new 3D file format loader

Target file: [client/src/widgets/Model3DViewer/classes/Loader/Loader.ts](../../../client/src/widgets/Model3DViewer/classes/Loader/Loader.ts). The current loader supports only `.gltf`/`.glb` and dispatches via a single `GLTFLoader`. This skill turns that into an extension-keyed loader registry and adds one new format to it.

## Inputs

- File format and extension (e.g. `fbx` for `.fbx`)
- Three.js loader class name and import path (e.g. `FBXLoader` from `three/examples/jsm/loaders/FBXLoader.js`)
- Server-side enforcement: max file size, allowed MIME types

## Steps

1. **Add the loader to the registry** in `Loader.ts`:
   - Extend `Loader.loaders` with the new key (e.g. `fbx: new FBXLoader()`).
   - Import the loader class via static `import` (not dynamic) — the registry is created once at module load.

2. **Dispatch by extension** — convert `Loader.load(filepath)` from "always GLTF" to a switch on the file extension. Pseudocode:
   ```ts
   const ext = filepath.split('.').pop()?.toLowerCase();
   const loader = Loader.loaders[ext];
   if (!loader) throw new Error(`No loader registered for extension: ${ext}`);
   ```
   Keep the cache (`LoaderCache`) keyed by `filepath` regardless of format.

3. **Normalise the result** to the `LoadedModel3D` shape (defined in `widgets/Model3DViewer/classes/types/`). GLTF returns `{ scene, animations, parser }`; FBX returns a `Group` with `animations`; OBJ returns a `Group` only; STL returns a `BufferGeometry`. Wrap each format into a consistent `{ scene, animations, associations? }` shape — for formats without `parser.associations`, return `undefined`.

4. **Wire any GLTF-specific assumptions out of consumers.** Audit:
   - `World.ts` — does it assume materials carry GLTF metadata?
   - `useAnimations.ts` — does it require GLTF animation clips?
   - `displayPresets.ts` — does it assume a GLTF scene root?

   Make these consumers tolerate the new shape. Add a TODO comment if a deeper refactor is required.

5. **Backend upload validation** — update:
   - `server/src/constants/files.ts` — add the new extension to allowed lists, set size limit if different.
   - `server/src/pipes/file-extension-validator.pipe.ts` and `file-type-validator.pipe.ts` consumers in `models-3d` upload pipeline.
   - If the format requires special handling on disk (e.g. companion `.mtl` for `.obj`, textures for `.fbx`), update `IFileStorageStrategy` consumers and the multer config.

6. **Client upload widget** — `widgets/Upload3DModelModal/` — extend the dropzone `accept` map and any extension display copy.

7. **Verify**
   - `cd client && npm run lint && npm run tscheck`
   - `cd server && npm run lint && npm run tscheck`
   - Manually upload a sample file, render it, navigate away and back to confirm the cache and `Destroyer` cleanup paths work for the new format.

## Don't

- Don't load the new loader class inside the `Loader.load` body — keep it static-imported on the registry, otherwise every load incurs an extra dynamic-import round-trip.
- Don't bypass `LoaderCache` — formats that load fast still benefit from cache; formats that load slow benefit even more.
- Don't add a new `<Format>Loader` instance per call — register it once in `Loader.loaders`.
- Don't accept formats server-side that the client can't render — keep the upload allowlist in sync with the registry.
