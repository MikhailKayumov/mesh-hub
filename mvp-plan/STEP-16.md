# STEP-16 — Scenes Frontend

**Block:** 6 — Scene Composer
**Prerequisites:** STEP-15 (backend), STEP-6 (viewer refactor), STEP-8 (S3-agnostic URLs)
**Parallel with:** nothing — this is the last block

---

## Goal

Build the Scene Composer: a multi-model 3D viewer that loads saved scene configs,
manages objects and lights, and integrates with the scenes backend.

---

## 1. RTK Query — API Module

**`client/src/app/api/scenes.ts`** — New file:

Endpoints:
- `scenes` — GET `/scenes?workspaceId=` — provides `Scenes`.
- `scene` — GET `/scenes/:id` — provides `Scene`.
- `createScene` — POST, invalidates `Scenes`.
- `updateScene` — PATCH, invalidates `Scene`, `Scenes`.
- `deleteScene` — DELETE, invalidates `Scenes`.
- `addSceneObject` — POST `/scenes/:id/objects`, invalidates `Scene`.
- `updateSceneObject` — PATCH `/scenes/:id/objects/:objId`, invalidates `Scene`.
- `removeSceneObject` — DELETE, invalidates `Scene`.
- `addSceneLight` — POST `/scenes/:id/lights`, invalidates `Scene`.
- `updateSceneLight` — PATCH, invalidates `Scene`.
- `removeSceneLight` — DELETE, invalidates `Scene`.
- `uploadSceneHdri` — POST `/scenes/:id/hdri`, invalidates `Scene`.
- `uploadSceneThumbnail` — POST `/scenes/:id/thumbnail`, invalidates `Scene`, `Scenes`.

Add tags `Scene`, `Scenes` to tags file.

---

## 2. Viewer Extensions — `Viewer.loadScene()`

**`client/src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`**

```ts
public async loadScene(scene: SceneResponseDto): Promise<void> {
  // Clear previous scene content
  this.world.clearScene();

  // Configure background and ambient light
  this.renderer.setBackground(scene.config.backgroundColor);
  this.world.setAmbientLight(scene.config.ambientLightIntensity);

  // Load all model objects in parallel with allSettled (partial failure tolerance)
  const results = await Promise.allSettled(
    scene.objects.map(async (obj) => {
      const url = getModel3DFileSrc(obj.model.id, obj.model.file.entryFile);
      const gltf = await Loader.load(url);
      const group = gltf.scene;
      group.position.set(obj.posX, obj.posY, obj.posZ);
      group.rotation.set(obj.rotX, obj.rotY, obj.rotZ);
      group.scale.set(obj.scaleX, obj.scaleY, obj.scaleZ);
      group.userData.sceneObjectId = obj.id;
      this.world.scene.add(group);
    })
  );

  // Log any failed loads (don't crash entire scene)
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`Scene object ${scene.objects[i].id} failed to load:`, r.reason);
    }
  });

  // Add lights
  for (const light of scene.lights) {
    this.world.addLight(light);
  }

  // Load HDRI if present
  if (scene.config.environmentHdriPath) {
    await this.world.loadHdri(`/api/scenes/${scene.id}/hdri`);
  }

  // Apply camera bookmarks
  if (scene.config.cameraBookmarks.length > 0) {
    // First bookmark = initial camera position
    const bm = scene.config.cameraBookmarks[0];
    this.camera.controls.setLookAt(
      bm.posX, bm.posY, bm.posZ,
      bm.targetX, bm.targetY, bm.targetZ,
      false
    );
  }
}
```

### Configurable LRU Cache

`Loader.ts` has an internal GLTF cache. For scenes with many models, increase cache size:

```ts
// In Viewer constructor or in loadScene:
Loader.resizeCache(20); // default was 10
```

Expose a static method on `Loader`:
```ts
public static resizeCache(maxItems: number): void {
  this.cache.max = maxItems; // uses lru-cache or similar
}
```

### `World.ts` Extensions

```ts
public clearScene(): void {
  // Remove all non-essential objects (keep helpers, grid)
  this.scene.children
    .filter(c => c.userData.isSceneObject || c.userData.isLight)
    .forEach(c => this.scene.remove(c));
}

public addLight(lightDto: SceneLightDto): void {
  let light: THREE.Light;
  switch (lightDto.type) {
    case 'directional':
      light = new THREE.DirectionalLight(lightDto.color, lightDto.intensity);
      break;
    case 'point':
      light = new THREE.PointLight(lightDto.color, lightDto.intensity);
      break;
    case 'spot':
      light = new THREE.SpotLight(lightDto.color, lightDto.intensity);
      break;
  }
  light.position.set(lightDto.posX, lightDto.posY, lightDto.posZ);
  light.castShadow = lightDto.castShadow;
  light.userData.isLight = true;
  light.userData.lightId = lightDto.id;
  this.scene.add(light);
}

public async loadHdri(url: string): Promise<void> {
  // Use Three.js RGBELoader or EXRLoader for HDR files
  const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
  const loader = new RGBELoader();
  const texture = await loader.loadAsync(url);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  this.scene.environment = texture;
  this.scene.background = texture;
}
```

---

## 3. Pages

### `pages/Scenes/`

**Route:** `/workspaces/:workspaceId/scenes`
Lists all scenes in the workspace. Grid layout matching `Models3DList`.

```
pages/Scenes/
├── index.tsx
└── ScenesPage.tsx
```

Uses `useScenesQuery({ workspaceId })`.
Each scene card shows: thumbnail, name, object count, "Edit" and "Delete" buttons.

### `pages/SceneEditor/`

**Route:** `/workspaces/:workspaceId/scenes/:sceneId`

```
pages/SceneEditor/
├── index.tsx
├── SceneEditorPage.tsx
├── SceneEditorPage.module.scss
└── components/
    ├── SceneObjectsPanel.tsx
    ├── SceneLightsPanel.tsx
    ├── SceneSettingsPanel.tsx
    └── SceneCameraBookmarks.tsx
```

### `SceneEditorPage.tsx`

Layout: full-screen viewer + collapsible left sidebar.

- Loads scene via `useSceneQuery({ sceneId })`.
- Calls `viewer.loadScene(scene)` when data is ready.
- Toolbar: "Objects" | "Lights" | "Settings" | "Camera" → activates corresponding panel.
- Auto-save: debounced (500ms) `updateScene` mutation on any change.
- "Save thumbnail" button → calls `viewer.renderer.takeScreenshot()` then
  `useUploadSceneThumbnailMutation`.

### `SceneObjectsPanel.tsx`

Props: `scene: SceneResponseDto`, `workspaceId: string`.

- Lists current objects with transform controls (numeric inputs for X/Y/Z position, rotation, scale).
- "Add model" → `Combobox` searching models in the workspace → `useAddSceneObjectMutation`.
- Remove button → `useRemoveSceneObjectMutation`.
- Selecting an object in the panel → highlights it in viewer (`THREE.BoxHelper` overlay).

**Viewer object selection:**
In `Viewer.ts`, add:
```ts
public setSelectedObject(sceneObjectId: string | null): void {
  // Remove existing highlight
  this.world.clearHighlight();
  if (!sceneObjectId) return;
  // Find the group with matching userData.sceneObjectId
  const group = this.world.scene.children.find(
    c => c.userData.sceneObjectId === sceneObjectId
  );
  if (group) this.world.highlightObject(group);
}
```

### `SceneLightsPanel.tsx`

Lists lights with type selector (DirectionalLight / PointLight / SpotLight),
color picker, intensity slider, position inputs.
"Add light" → `useAddSceneLightMutation`.

### `SceneSettingsPanel.tsx`

- Background color picker → updates `scene.config.backgroundColor`.
- Ambient light intensity slider.
- HDRI upload button (shown only if plan allows) → `useUploadSceneHdriMutation`.

### `SceneCameraBookmarks.tsx`

- Lists bookmarks from `scene.config.cameraBookmarks`.
- "Capture current view" button → reads current camera position from viewer,
  appends to bookmarks, calls `useUpdateSceneMutation`.
- Click a bookmark → `viewer.camera.flyTo(...)`.

---

## 4. Router Updates

```ts
{ path: '/workspaces/:workspaceId/scenes', element: lazy(() => import('@/pages/Scenes')) }
{ path: '/workspaces/:workspaceId/scenes/:sceneId', element: lazy(() => import('@/pages/SceneEditor')) }
```

Add "Scenes" link to the workspace navigation sidebar.

---

## Verification

1. Create a scene with 2 objects → `loadScene()` loads both in parallel.
2. One model URL 404 → other model still appears (allSettled partial tolerance).
3. Growth plan scene → HDRI uploads successfully; renders in viewer.
4. Starter plan → HDRI upload button disabled; shows "Upgrade plan" tooltip.
5. Camera bookmark captured → navigate away → bookmark persists after reload.
6. Transform inputs update object position in real-time in viewer.
7. LRU cache of 20 items → 20 unique models loaded without eviction.
