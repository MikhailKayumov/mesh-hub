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
│       ├─ Renderer             ← WebGLRenderer + ResizeObserver + clock
│       └─ World                ← Scene + lights + helpers + event bus
│           └─ Loader (static)  ← GLTFLoader + LoaderCache (3 entries)
│               └─ Destroyer (static) ← geometry/material disposal utility
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
  onInit?:    (viewer: Viewer) => void | Promise<void>;
  onReady?:   (viewer: Viewer) => void | Promise<void>;
  onDestroy?: (viewer?: Viewer) => void | Promise<void>;
}
```

| Prop | Required | Description |
|---|---|---|
| `model` | Yes | Model metadata from the API. When `model` changes (by `file.id`), the viewer destroys the current world and loads the new model. Pass `null` to render an empty viewer. |
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

Effect 2 — run (depends on [viewer, model.file.id])
  ├─ viewer.camera.enableLayer(1)
  ├─ viewer.world.destroy()             ← clears previous scene objects
  ├─ viewer.loadModel(model)            ← GLTFLoader → cache check → spawn
  ├─ viewer.world.prepare(sceneBB)      ← adds 3 directional lights + ambient
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

### Public Methods

| Method | Signature | Description |
|---|---|---|
| `init` | `(): this` | Attaches camera controls to the renderer canvas; adds Stats update callback if in dev mode |
| `loadModel` | `(modelData: Model3DResponseDto): Promise<void>` | Loads a GLTF model: checks `Loader.cache` first, otherwise calls `Loader.load()`, processes bounding box and materials, spawns scene, stores in cache |
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

Wraps `Three.WebGLRenderer`, manages a `ResizeObserver`, and orchestrates a per-frame callback set.

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
| `addCallback` | `(callback: RenderCallback): () => void` | Registers a per-frame callback; returns a removal function |
| `removeCallback` | `(callback: RenderCallback): void` | Unregisters a per-frame callback |
| `resize` | `(): void` | Reads container `getBoundingClientRect()` and resizes renderer + camera |
| `destroy` | `(): void` | Stops animation loop, clears callbacks, disposes renderer and render target |

### `RenderCallback` Type

```ts
type RenderCallback = (delta: number, elapsed: number, clock: Clock) => void | Promise<void>;
```

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

Static utility class. Loads GLTF/GLB files and maintains an LRU-style cache.

### Static Members

| Member | Type | Description |
|---|---|---|
| `cache` | `LoaderCache` | In-memory model cache; capacity **3 entries** |
| `loaders.gltf` | `GLTFLoader` | Shared Three.js GLTF loader instance |

### Static Methods

| Method | Signature | Description |
|---|---|---|
| `load` | `(filepath: string): Promise<LoadedModel3D>` | Loads a GLTF/GLB from `filepath` using `GLTFLoader.loadAsync`; returns `{ scene, animations, associations }` |

> **Cache cap:** `LoaderCache` is initialised with a capacity of `3`. When a 4th model is loaded, the oldest entry is evicted. This is an intentional memory constraint to avoid unbounded GPU/memory growth when navigating between models.

---

## Class: `Destroyer`

**File:** `src/widgets/Model3DViewer/classes/Destroyer/Destroyer.ts`

Static utility for safely disposing Three.js objects.

### Static Methods

| Method | Description |
|---|---|
| `Destroyer.destroyObject(object)` | Disposes geometry and all materials on a mesh; safe to call as `scene.traverse(Destroyer.destroyObject)` |

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

## Development Notes

- **Stats panel:** A `three/addons/libs/stats.module.js` FPS/memory panel is appended to the container in `development` mode only (`import.meta.env.MODE !== 'development'` guard in `Viewer.createStats()`).
- **GLTF console log:** `Loader.load()` logs the full parsed GLTF result to the console (`console.log('==== GLTF ====',...)`). This is intentional for development inspection and should be removed before production hardening.
- **`preserveDrawingBuffer: true`:** Required for `getScreenshot()` (`toDataURL`) to work; without it the canvas buffer is cleared after each frame.

