---
name: optimize-gltf
description: Use when a GLTF/GLB model is too heavy — large file size, slow parse, slow first render, or excessive GPU memory. Guidance on Draco / KTX2 / Meshopt / mesh decimation paths and where to wire decoders in the MeshHub viewer.
---

# Optimise GLTF assets

This is a guidance skill — produces recommendations, not direct edits to user models. Three optimisation axes:

| Axis | Problem | Fix |
|---|---|---|
| Geometry size | 100k+ vertices, large file | Draco compression, `gltf-transform` decimation |
| Texture size | Large PNGs/JPEGs | KTX2 (Basis) compression, mipmaps |
| Mesh count | Many separate draw calls | `gltf-transform` `weld` + `dedup` + `instance` |

## Server side

If MeshHub is to enforce optimisation on upload:

- **Reject oversize**: enforce 3 GB limit (already in place via the file pipe; tune downward if median file size is small).
- **Optional pre-process**: run `gltf-transform optimize` server-side on upload (Node: `@gltf-transform/cli`). Non-destructive: store both original and optimised; serve optimised by default. Only worth it if upload-side cost is acceptable.
- **Validation**: parse on upload to confirm the file is valid GLTF — early reject malformed files. Use the same `GLTFLoader` parsing path the viewer uses, but headlessly (no scene mount).

## Client side

The viewer (`Loader.ts`) uses Three.js `GLTFLoader`. To support optimised models the loader must register decoders:

1. **Draco**:
   ```ts
   import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
   const draco = new DRACOLoader();
   draco.setDecoderPath('/draco/');   // host the decoder under public/
   gltfLoader.setDRACOLoader(draco);
   ```
   Place `draco_*` files in `client/public/draco/` (download from three.js examples).

2. **KTX2**:
   ```ts
   import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
   const ktx2 = new KTX2Loader();
   ktx2.setTranscoderPath('/basis/').detectSupport(renderer);
   gltfLoader.setKTX2Loader(ktx2);
   ```
   Place `basis_*` files in `client/public/basis/`. **Requires renderer instance** for `detectSupport` — wire after the viewer's WebGLRenderer exists.

3. **Meshopt**:
   ```ts
   import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
   gltfLoader.setMeshoptDecoder(MeshoptDecoder);
   ```

In `Loader.ts`, register these on the `GLTFLoader` instance when it's constructed in the loader registry. Keep them static — they parse a model only once and the decoders are reusable across loads.

## Recommendations to surface to users

- **Suggest**: model file > 50 MB, or > 500k triangles, or > 10 unique textures of >1k resolution.
- **Show**: file size, triangle count, texture count + resolutions on the model detail page (data is available from `parser.json` in the GLTF result).
- **Provide**: a "best practices" doc link (Draco compression, texture sizing, single-mesh-per-material).

## Don't

- Don't transcode KTX2 client-side without `detectSupport` — devices without basis support will fail to render.
- Don't bundle the Draco WASM decoder in the main JS bundle — keep it under `public/` and load it from there.
- Don't run server-side optimisation on every upload by default — make it opt-in or background-job-driven; sync optimisation can timeout on large files.
