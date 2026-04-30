# Model3DViewer — 3D Viewer Architecture

The `Model3DViewer` widget (`src/widgets/Model3DViewer/`) wraps a fully custom Three.js rendering stack in a React component. The rendering logic is implemented as plain TypeScript classes; React integration is handled by a single hook (`useViewer`) and a context provider.

---

## Overview

```
Model3DViewer (React component)
│
├─ useViewer(props)              ← lifecycle hook
│   └─ Viewer                   ← orchestrator class
│       ├─ CameraController     ← Three.js PerspectiveCamera + camera-controls
│       ├─ Renderer             ← WebGLRenderer + EffectComposer + CSS2DRenderer + ResizeObserver + clock
│       ├─ World                ← Scene + lights (LightBuilder) + helpers + event bus
│       │   └─ Loader (static)  ← per-format loaders + LoaderCache (3 entries)
│       │       └─ Destroyer (static) ← geometry/material/texture disposal utility
│       └─ MeasureTool           ← optional distance-measure overlay
│
├─ ViewerContextProvider        ← shares Viewer instance to child components
├─ Model3DViewerTopBar          ← camera controls UI
└─ Model3DViewerBottomBar       ← fullscreen toggle, renderer info
```

---

## React Entry Point

**File:** `src/widgets/Model3DViewer/index.tsx`

```tsx
export function Model3DViewer(props: Model3DPageViewerProps) { ... }
export type Model3DPageViewerProps = UseViewerProps;
```

The component:
1. Creates the `Viewer` instance and mounts it into a `<div ref={placeRef}>` via `useViewer`.
2. Provides the `Viewer` to child components via `ViewerContextProvider`.
3. Prevents middle-click scroll via `usePreventMiddleClick`.
4. Wires fullscreen toggle via Mantine's `useFullscreenElement`.

---

## `UseViewerProps` — Public Component API

**File:** `src/widgets/Model3DViewer/hooks/useViewer.ts`

```ts
interface UseViewerProps {
  model: Model3DResponseDto | null;
  displayConfig?: DisplayConfigResponseDto | null;
  materialOverrides?: MaterialOverrideResponseDto[] | null;
  onInit?:    (viewer: Viewer) => void | Promise<void>;
  onReady?:   (viewer: Viewer) => void | Promise<void>;
  onDestroy?: (viewer?: Viewer) => void | Promise<void>;
}
```

| Prop | Required | Description |
|---|---|---|
| `model` | Yes | Model metadata from the API. When `model.id` (or `?versionId`) changes, the viewer destroys the current world and loads the new model. Pass `null` to render an empty viewer. |
| `displayConfig` | No | Persisted display configuration (background, ambient, fog, lights, renderer settings, post-process passes). Applied between `world.prepare` and `viewer.run`. |
| `materialOverrides` | No | Per-material overrides applied via `world.applyMaterialOverrides` after the display config. |
| `onInit` | No | Called once after the `Viewer` is created and `setPlace` + `init` have run. Use this to configure the viewer before the first model load. |
| `onReady` | No | Called after the model is fully loaded, lights prepared, and the camera has animated to its initial position. Use this to add editor helpers or start animations. |
| `onDestroy` | No | Called in the effect cleanup, before `viewer.destroy()`. |

---

## `useViewer` Hook Lifecycle

```
Mount
  │
  ▼
Effect 1 — init (runs once)
  ├─ new Viewer()
  ├─ viewer.setPlace(placeRef.current)
  ├─ viewer.init()                      ← attaches camera controls to canvas
  ├─ onInit?.(viewer)
  └─ cleanup: onDestroy?.(viewer), viewer.destroy()

Effect 2 — run (depends on [viewer, model.id, ?versionId])
  ├─ viewer.camera.enableLayer(1)
  ├─ viewer.world.destroy()             ← clears previous scene objects
  ├─ viewer.loadModel(model) | loadFile(versionUrl)  ← Loader → cache check → spawn
  ├─ viewer.world.prepare(sceneBB)      ← adds 3 directional lights + ambient
  ├─ if displayConfig:
  │   ├─ world.setBackgroundColor / setAmbientLight / setFog
  │   ├─ world.syncLights(displayConfig.lights)
  │   ├─ renderer.setSettings(rendererConfig)
  │   └─ renderer.setPostProcessing(postProcess)   ← rebuilds composer pass chain
  ├─ if materialOverrides: world.applyMaterialOverrides(...)
  ├─ viewer.run()                       ← starts requestAnimationFrame loop
  ├─ camera.moveToInitPosition(sceneBB) ← instant fit + rotate to 194°/58°
  ├─ onReady?.(viewer)
  ├─ sleep(100ms)                       ← brief pause for smooth transition
  └─ camera.fitToBox(sceneBB)           ← animated fit + rotate to 0°/76°
```

---

## Class: `Viewer`

**File:** `src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`

The top-level orchestrator. Owns and initialises all sub-systems.

### Public Fields

| Field | Type | Description |
|---|---|---|
| `place` | `HTMLDivElement \| undefined` | DOM container the renderer's `<canvas>` is appended to |
| `renderer` | `Renderer` | WebGL renderer instance |
| `camera` | `CameraController` | Camera + orbital controls |
| `world` | `World` | Three.js scene + lights + helpers |
| `stats` | `Stats \| null` | three.js Stats panel (development mode only) |
| `model` | `ViewerModel3D<Model3DResponseDto> \| null` | Currently loaded model, or `null` |
| `measureTool` | `MeasureTool` | Distance-measure overlay; activated via `setMode('measure')` |
| `mode` | `ViewerMode` | Current interaction mode (`'view'` \| `'comment'` \| `'annotate'` \| `'measure'`) |

### Public Methods

| Method | Signature | Description |
|---|---|---|
| `init` | `(): this` | Attaches camera controls to the renderer canvas; adds Stats update callback if in dev mode |
| `loadModel` | `(modelData: Model3DResponseDto): Promise<void>` | Loads the model's primary file: checks `Loader.cache` first, otherwise calls `Loader.load()`, processes bounding box and materials, spawns scene, stores in cache |
| `loadFile` | `(url: string): Promise<void>` | Loads an arbitrary version URL through `Loader.load()` (used when `?versionId` is set in the URL) |
| `setMode` | `(mode: ViewerMode): void` | Switches interaction mode. Starts `measureTool` for `'measure'`, stops it for any other mode. |
| `run` | `(): Promise<void>` | Starts the animation loop via `renderer.run()` |
| `destroy` | `(): void` | Destroys world, detaches camera controls, destroys renderer |
| `setPlace` | `(place: HTMLDivElement): this` | Moves the renderer canvas to a new DOM container; re-attaches Stats dom |
| `loadScene` | `(scene: SceneResponseDto): Promise<void>` | Clears the current world and loads all objects + lights from a scene DTO. Each `SceneObjectResponseDto` is loaded via `loadModel` with its transform applied. Each `SceneLightResponseDto` is added via `addLight`. |
| `setSelectedObject` | `(id: string \| null): void` | Highlights the scene object with the given ID by enabling a selection layer / outline effect. Pass `null` to clear the selection. |
| `addLight` | `(config: AddSceneLightDto): void` | Adds a `Three.js` light to the world using the provided config (`type`, `color`, `intensity`, `position`). Supported types: `'point'`, `'directional'`, `'spot'`, `'ambient'`. |
| `clearScene` | `(): void` | Removes all scene objects and lights added via `loadScene` / `addLight`, leaving the base world intact. |
| `loadHdri` | `(url: string): Promise<void>` | Loads an HDRI image from `url` via `RGBELoader` and sets it as the scene environment map and background. |

### Model Processing (private)

After loading, `Viewer.processLoadedModel` does the following for each mesh in the scene:
- Computes bounding boxes and bounding spheres
- For `SkinnedMesh`: iterates all vertices applying bone transforms to get the true world-space bounding box
- Sets `castShadow = true` and `receiveShadow = true` on all objects
- Marks all materials as `needsUpdate = true`
- Centers the scene on the XZ plane and lifts it to Y=0 based on bounding box minimum

---

## Class: `CameraController`

**File:** `src/widgets/Model3DViewer/classes/Camera/Camera.ts`

Extends `EventTarget`. Wraps Three.js `PerspectiveCamera` and the `camera-controls` library.

### Public Fields

| Field | Type | Description |
|---|---|---|
| `camera` | `PerspectiveCamera` | Three.js perspective camera (FOV 45°, near 0.05, far 5000) |
| `control` | `CameraControls \| null` | camera-controls instance (created when `on()` is called) |

### Public Methods

| Method | Signature | Description |
|---|---|---|
| `on` | `(canvas: HTMLCanvasElement): void` | Attaches camera controls to canvas; calls `resize()` |
| `off` | `(): void` | Disposes camera controls |
| `update` | `(delta: number): Promise<boolean> \| undefined` | Advances camera-controls animation by `delta` seconds |
| `resize` | `(): void` | Recalculates `camera.aspect` from canvas dimensions |
| `enableLayer` | `(layer: number \| number[]): void` | Enables one or more Three.js camera layers |
| `disableLayer` | `(layer: number \| number[]): void` | Disables one or more camera layers |
| `disableLayers` | `(layers?: number[] \| null): void` | Disables all layers, or a specific list |
| `moveToInitPosition` | `(boundingBox: Box3): Promise<void>` | Instantly fits camera to bounding box then rotates to azimuth 194° / polar 58° |
| `fitToBox` | `(boundingBox: Box3, padding?: number): Promise<void>` | Smoothly animates camera to fit bounding box; rotates to azimuth 0° / polar 76° |

### Mouse Button Mapping

| Button | Action |
|---|---|
| Left | `TRUCK` (pan) |
| Right | `ROTATE` (orbit) |
| Middle | `NONE` (disabled to prevent page scroll) |

---

## Class: `Renderer`

**File:** `src/widgets/Model3DViewer/classes/Renderer/Renderer.ts`

Wraps `Three.WebGLRenderer`, an `EffectComposer` post-processing pipeline, a `CSS2DRenderer` overlay (used by `MeasureTool` labels and any future world-anchored DOM), a `ResizeObserver`, and a per-frame callback set.

### Constructor Parameters (`RendererParameters`)

Extends `WebGLRendererParameters` with:

| Extra Field | Type | Description |
|---|---|---|
| `world` | `World` | Scene reference for render calls |
| `cameraController` | `CameraController` | Camera reference for render calls |
| `place` | `HTMLDivElement \| undefined` | Optional initial container |

Default renderer settings: `ReinhardToneMapping`, `toneMappingExposure = 1.0`, `PCFSoftShadowMap`, transparent clear color (alpha 0).

### Public Fields

| Field | Type | Description |
|---|---|---|
| `renderer` | `WebGLRenderer` | The underlying Three.js renderer |
| `clock` | `Clock` | Three.js clock used for delta/elapsed time in each frame |

Internal (private) fields:

| Field | Type | Description |
|---|---|---|
| `composer` | `EffectComposer` | Post-processing pipeline. Always contains at least `RenderPass` (index 0) + `OutputPass`. |
| `renderPass` | `RenderPass` | First pass; renders scene + camera into the composer's first render target. |
| `css2dRenderer` | `CSS2DRenderer` | Absolute-positioned overlay renderer for `CSS2DObject` labels (pointer events disabled). |

### Public Methods

| Method | Signature | Description |
|---|---|---|
| `run` | `(callback?: RenderCallback): void` | Starts `requestAnimationFrame` loop via `setAnimationLoop`; optionally registers a callback |
| `render` | `(): Promise<void>` | One render frame: resets renderer info, ticks clock, calls all callbacks, renders scene |
| `getCanvas` | `(): HTMLCanvasElement` | Returns `renderer.domElement` |
| `setPlace` | `(place: HTMLDivElement): void` | Appends canvas to new container; wires `ResizeObserver` |
| `getInfo` | `(): WebGLRenderer['info']` | Returns renderer stats (draw calls, triangles, etc.) |
| `getScreenshot` | `(): string` | Returns a `data:image/png` base64 screenshot at 20% quality |
| `getSettings` | `(): RendererSettings` | Returns current renderer settings snapshot |
| `setSettings` | `(settings: RendererSettings): void` | Applies output color space, tone mapping, shadow map type, clear color |
| `setPostProcessing` | `(config: PostProcessConfig): Promise<void>` | Disposes every pass after `RenderPass` and re-adds the enabled passes (in the order described below). Pass modules are dynamically imported. |
| `addCallback` | `(callback: RenderCallback): () => void` | Registers a per-frame callback; returns a removal function |
| `removeCallback` | `(callback: RenderCallback): void` | Unregisters a per-frame callback |
| `resize` | `(): void` | Reads container `getBoundingClientRect()` and resizes renderer + camera |
| `destroy` | `(): void` | Stops animation loop, clears callbacks, disposes renderer and render target |

### `RenderCallback` Type

```ts
type RenderCallback = (delta: number, elapsed: number, clock: Clock) => void | Promise<void>;
```

### Post-Processing Pipeline

`Renderer.setPostProcessing(config)` rebuilds the composer pass chain. Order is fixed and matches `setPostProcessing`'s sequential `addPass` calls:

| Order | Pass | Source | Toggle |
|---|---|---|---|
| 1 | `RenderPass` | `three/examples/jsm/postprocessing/RenderPass.js` | Always present |
| 2 | `SSAOPass` | `three/examples/jsm/postprocessing/SSAOPass.js` | `config.ssao.enabled` |
| 3 | `UnrealBloomPass` | `three/examples/jsm/postprocessing/UnrealBloomPass.js` | `config.bloom.enabled` |
| 4 | `BokehPass` (DoF) | `three/examples/jsm/postprocessing/BokehPass.js` | `config.dof.enabled` |
| 5 | `ShaderPass(VignetteShader)` | `three/examples/jsm/shaders/VignetteShader.js` | `config.vignette.enabled` |
| 6 | `ShaderPass(ColorCorrectionShader)` | `three/examples/jsm/shaders/ColorCorrectionShader.js` | `config.colorCorrection.enabled` |
| 7 | `OutputPass` | `three/examples/jsm/postprocessing/OutputPass.js` | Always re-appended last (handles tone mapping + color-space conversion) |

```ts
interface PostProcessConfig {
  ssao?:            { enabled: boolean; kernelRadius?: number; minDistance?: number; maxDistance?: number; };
  bloom?:           { enabled: boolean; strength?: number; radius?: number; threshold?: number; };
  dof?:             { enabled: boolean; focus?: number; aperture?: number; maxblur?: number; };
  vignette?:        { enabled: boolean; offset?: number; darkness?: number; };
  colorCorrection?: { enabled: boolean; powRGB?: [number, number, number]; mulRGB?: [number, number, number]; addRGB?: [number, number, number]; };
}
```

> **Notes**
> - Pass modules are dynamically imported (`await import(...)`) so disabling a pass keeps it out of the bundle.
> - On rebuild, every pass after index 0 has its `dispose?.()` called before being popped, then `OutputPass` is re-appended — never insert passes after `OutputPass`.
> - `destroy()` calls `dispose?.()` on every pass and then `composer.dispose()` to release ping-pong render targets.
> - Adding a new effect: see the [`add-postprocess-effect`](#related-skills) skill.

---

## Class: `World`

**File:** `src/widgets/Model3DViewer/classes/World/World.ts`

Extends `EventTarget`. Manages the Three.js `Scene`, all spawned objects, lights, and debug helpers.

### Public Fields

| Field | Type | Description |
|---|---|---|
| `scene` | `Scene` | The Three.js scene |
| `models` | `Object3D[]` | All spawned model objects (currently populated by `spawn`) |
| `lights` | `Light[]` | All spawned lights |
| `helpers` | `WorldHelpers` | Debug helpers: `axis`, `grid`, `ground`, `sceneBoundingBox` |

### Public Methods

| Method | Signature | Description |
|---|---|---|
| `add` | `(object: Object3D, layer?: number): void` | Adds object to scene and sets layer on all descendants (default layer 0) |
| `spawn` | `(object: WorldObject3D \| WorldObjects3D, options?: WorldSpawnOptions): Promise<void>` | Adds one or many objects; dispatches `WorldSceneChange` event unless `options.silent = true` |
| `on` | `(name: WorldEvent, listener): () => void` | Subscribes to a world event; returns unsubscribe function |
| `off` | `(name: WorldEvent, listener): void` | Unsubscribes from a world event |
| `prepare` | `(sceneBB?: Box3): Promise<void>` | Spawns 3 directional lights + 1 ambient light, scaled to the scene's bounding box |
| `spawnAxisHelper` | `(size?: number): Promise<void>` | Adds/replaces the axes helper (layer 10) |
| `spawnGridHelper` | `(size?, division?, color1?, color2?, layer?): Promise<void>` | Adds/replaces the grid helper |
| `spawnGroundHelper` | `(w?, h?, layer?, options?): Promise<void>` | Adds/replaces a shadow-receiving ground plane |
| `spawnSceneBoundingBoxHelper` | `(bb: Box3, color?, layer?): Promise<void>` | Adds/replaces the bounding box wireframe helper |
| `destroy` | `(): void` | Traverses and disposes all scene objects; clears scene |

### World Layer Convention

| Layer | Purpose |
|---|---|
| `0` | Default — model objects |
| `1` | Lights |
| `9` | Ground shadow plane helper |
| `10` | Axis + grid helpers |
| `11` | Bounding box helper |
| `13` | Directional light helpers |

### `WorldSpawnOptions`

```ts
interface WorldSpawnOptions {
  layer?: number;   // override default layer assignment
  silent?: boolean; // suppress WorldSceneChange event
}
```

---

## Class: `Loader`

**File:** `src/widgets/Model3DViewer/classes/Loader/Loader.ts`

Static utility class. Dispatches to per-format loaders by file extension and maintains an in-memory cache via `LoaderCache`.

### Static Members

| Member | Type | Description |
|---|---|---|
| `cache` | `LoaderCache` | In-memory model cache; default capacity **3 entries** |
| `loaders.gltf` | `GLTFLoader` | Shared GLTF/GLB loader instance |
| `loaders.fbx` | `FBXLoader` | Shared FBX loader instance |
| `loaders.dae` | `ColladaLoader` | Shared Collada (DAE) loader instance |
| `loaders.stl` | `STLLoader` | Shared STL loader instance |

> OBJ + MTL loaders are constructed per-load — `MTLLoader.setResourcePath` and `OBJLoader.setMaterials` are stateful and would leak between calls if shared.

### Static Methods

| Method | Signature | Description |
|---|---|---|
| `load` | `(filepath: string): Promise<LoadedModel3D>` | Detects format from the URL extension and dispatches to the matching format loader. Falls back to GLTF on unknown extensions. |
| `resizeCache` | `(maxItems: number): void` | Updates `cache.maxSize` at runtime |

### Supported Formats

| Extension | Internal method | Notes |
|---|---|---|
| `.glb`, `.gltf` | `loadGltf` | Returns `{ scene, animations, associations }`. Associations are kept for material override + texture disposal. |
| `.fbx` | `loadFbx` | Wraps the loaded `Group`; missing/`MeshBasicMaterial` materials are replaced with `MeshStandardMaterial` defaults. |
| `.obj` | `loadObj` | Tries to load a sibling `.mtl` first; falls back to OBJ-only with default materials if absent or failing. |
| `.dae` | `loadDae` | Collada. Animations may live on either the result or the scene root. |
| `.stl` | `loadStl` | Wraps the parsed `BufferGeometry` in a `Mesh` with a default `MeshStandardMaterial`, then a `Group`. |

> Adding a new format: see the [`add-3d-loader`](#related-skills) skill.

---

## Class: `LoaderCache`

**File:** `src/widgets/Model3DViewer/classes/Loader/LoaderCache.ts`

In-memory cache for parsed models, keyed by file URL (the same string passed to `Loader.load`). Owns GPU resource disposal on eviction.

### Public Members

| Member | Type | Description |
|---|---|---|
| `maxSize` | `number` | Capacity. When `set` would exceed it, the oldest entry is evicted via `clear(1)`. |

### Public Methods

| Method | Signature | Description |
|---|---|---|
| `get` | `(name: string): ViewerModel3D \| null` | Returns the cached entry or `null`. |
| `set` | `(name: string, data: ViewerModel3D): void` | Stores an entry; evicts the oldest first if the store is at capacity. |
| `delete` | `(name: string): boolean` | Disposes geometries / materials / textures for the cached scene (via `Destroyer.destroyObject`) and any GLTF-associated `ImageBitmap` sources, then removes the entry. |
| `clear` | `(removeItemCount?: number): void` | Removes the first `n` entries (or all if omitted), each through `delete` so GPU memory is released. |

> **Capacity (default 3):** `Loader.cache = new LoaderCache(3)`. Hit a 4th model and the oldest entry is evicted to avoid unbounded GPU/memory growth when navigating between models. `Viewer.loadModel` checks the cache before calling `Loader.load`, so re-opening a recently visited model is instant.
>
> **Invalidation:** entries are keyed by URL. The editor invalidates a cached model by changing the URL (e.g. switching to `?versionId=<new>` or uploading a new version, which produces a new file path) — this naturally bypasses the previous key. To force eviction of an entry by URL, call `Loader.cache.delete(url)`; to drop everything, call `Loader.cache.clear()`.

---

## Class: `MeasureTool`

**File:** `src/widgets/Model3DViewer/classes/MeasureTool/MeasureTool.ts`

Optional distance-measurement tool. Owned by `Viewer` (`viewer.measureTool`) and toggled via `viewer.setMode('measure')` / `setMode('view')`. The user picks two points by clicking the model; the tool draws a screen-space line between them and a CSS2D label showing the distance in metres.

### Public Methods

| Method | Signature | Description |
|---|---|---|
| `start` | `(): void` | Attaches `pointerdown` (canvas) and `keydown` (window) listeners. First click stores point A (raycast hit on any non-measure mesh); second click draws the line + label and resets. `Escape` exits the mode via `viewer.setMode('view')`. |
| `stop` | `(): void` | Removes listeners, resets the pending point, and disposes the current line + label. |
| `dispose` | `(): void` | Alias for `stop()`. |

### Visuals

- Line uses `Line2` + `LineGeometry` + `LineMaterial` (`linewidth: 2`, `depthTest: false`, color `0x4dabf7`); `renderOrder = 999` so it draws on top.
- Label is a `CSS2DObject` (a styled `<div>` placed at the segment midpoint) rendered through `Renderer.css2dRenderer`.
- Both `line.userData.id` and `label.userData.id` are tagged `'measure-line'` so the raycaster excludes them when picking the next pair.

---

## Class: `Lights` / `LightBuilder`

**File:** `src/widgets/Model3DViewer/classes/Lights/LightBuilder.ts`

Factory for the light variants used by `World.prepare` and `World.syncLights`. Wraps Three.js light constructors and exposes a uniform shape so scene/model display configs can serialize and rebuild lights without referencing Three.js directly.

| Type | Three.js class |
|---|---|
| `'ambient'` | `AmbientLight` |
| `'directional'` | `DirectionalLight` |
| `'point'` | `PointLight` |
| `'spot'` | `SpotLight` |

> Adding a new light variant: see the [`add-light-type`](#related-skills) skill.

---

## Class: `Destroyer`

**File:** `src/widgets/Model3DViewer/classes/Destroyer/Destroyer.ts`

Static utility for safely disposing Three.js objects.

### Static Methods

| Method | Description |
|---|---|
| `Destroyer.destroyObject(object)` | Disposes geometry and all materials on a mesh; safe to call as `scene.traverse(Destroyer.destroyObject)` |
| `Destroyer.destroyImageBitmap(bitmap)` | Closes an `ImageBitmap` source backing a GLTF texture; called by `LoaderCache.delete` for cached entries. |

---

## Key Types

**Files:** `src/widgets/Model3DViewer/classes/types/`

```ts
// viewer.ts
interface ViewerAnimations {
  clips: AnimationClip[];
  objectGroup: AnimationObjectGroup;
}

interface LoadedModel3D {
  scene: Group;
  animations?: AnimationClip[];
  associations?: GLTFParser['associations'];
}

type ViewerModel3D<T = Record<any, any>> =
  Pick<LoadedModel3D, 'scene' | 'associations'> & {
    data: T;
    sceneBoundingBox: Box3;
    animations: ViewerAnimations | null;
  };

// renderer.ts
interface RendererSettings {
  outputColorSpace?: ColorSpace;
  shadowMapType?: ShadowMapType;
  toneMapping?: ToneMapping;
  toneMappingExposure?: number;
  clearColor?: string;
  clearAlpha?: number;
}
```

---

## Context

**File:** `src/widgets/Model3DViewer/context.tsx`

`ViewerContextProvider` shares the `Viewer` instance to all child components (TopBar, BottomBar) without prop drilling:

```tsx
<ViewerContextProvider viewer={viewer}>
  ...
</ViewerContextProvider>
```

Use the context hook (exported from `context.tsx`) inside any child component to access `viewer`.

---

## Hooks

**Directory:** [`src/widgets/Model3DViewer/hooks/`](../src/widgets/Model3DViewer/hooks/)

| Hook | File | Purpose |
|---|---|---|
| `useViewer` | [`useViewer.ts`](../src/widgets/Model3DViewer/hooks/useViewer.ts) | Lifecycle hook for the `Viewer` instance — creates it, mounts it on `placeRef`, runs the load/run cycle on `model.id` / `?versionId` change, and applies `displayConfig` + `materialOverrides`. Returns `{ placeRef, viewer }`. |
| `useViewerContext` | [`useViewerContext.ts`](../src/widgets/Model3DViewer/hooks/useViewerContext.ts) | `useContext(ViewerContext)` — returns the `Viewer` shared by `ViewerContextProvider`, or `null`. |
| `useViewerReviews` | [`useViewerReviews.ts`](../src/widgets/Model3DViewer/hooks/useViewerReviews.ts) | Loads model annotations via RTK Query, keeps the in-scene markers in sync, and exposes `startPlacement` / `clearPending` for placing new comments/annotations. |
| `useAnimations` | [`useAnimations.ts`](../src/widgets/Model3DViewer/hooks/useAnimations.ts) | Builds an `AnimationMixer` from the loaded model's clips, registers a per-frame mixer update on `Renderer`, and exposes play/pause/speed/loop state plus a clip selector with crossfade. Returns `null` when the model has no animations. |
| `usePreventMiddleClick` | [`usePreventMiddleClick.ts`](../src/widgets/Model3DViewer/hooks/usePreventMiddleClick.ts) | Returns `{ onMouseEnter, onMouseLeave }` props that toggle a document-level `mousedown` handler suppressing middle-click scroll while the pointer is over the viewer. |

---

## Development Notes

- **Stats panel:** A `three/addons/libs/stats.module.js` FPS/memory panel is appended to the container in `development` mode only (`import.meta.env.MODE !== 'development'` guard in `Viewer.createStats()`).
- **`preserveDrawingBuffer: true`:** Required for `getScreenshot()` (`toDataURL`) to work; without it the canvas buffer is cleared after each frame.

---

## Related Skills

The MeshHub agent harness ships with skills for the most common viewer extensions; prefer them over hand-wiring the same plumbing each time:

| Skill | Use for |
|---|---|
| [`add-postprocess-effect`](../../.claude/skills/add-postprocess-effect/SKILL.md) | Adding a new `EffectComposer` pass (Bloom, SSAO, DoF, Vignette, ColorCorrection, FXAA, custom `ShaderPass`). Wires the config through `PostProcessConfig`, the model display config UI, and ensures pass order/disposal are correct. |
| [`add-3d-loader`](../../.claude/skills/add-3d-loader/SKILL.md) | Adding a new file format loader (FBX, OBJ, DAE, STL, etc.) — registers it in `Loader.ts`, dispatches by extension, normalises the result into `LoadedModel3D`, and updates upload validation. |
| [`add-light-type`](../../.claude/skills/add-light-type/SKILL.md) | Adding a new light variant to `LightBuilder`, the `scene_light` entity, the editor UI, and serialization. |

