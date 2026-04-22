# STEP-13 — Reviews & Annotations (Frontend + Viewer Extensions)

**Block:** 4 — Review Tools
**Prerequisites:** STEP-12 (backend), STEP-6 (viewer refactor)
**Parallel with:** STEP-14 (versions)

---

## Goal

Surface reviews and annotations in the 3D viewer. Extend the `Viewer` class to
support comment pinning (click-to-place) and annotation markers. Build the
`ReviewPanel` and `AnnotationManager` widgets.

---

## 1. RTK Query — API Module

**`client/src/app/api/reviews.ts`** — New file:

Endpoints:
- `modelComments` — GET `/models-3d/:modelId/comments` — provides `[Comments]`.
- `addComment` — POST, invalidates `[Comments]`.
- `updateComment` — PATCH, invalidates `[Comments]`.
- `deleteComment` — DELETE, invalidates `[Comments]`.
- `modelAnnotations` — GET `/models-3d/:modelId/annotations` — provides `[Annotations]`.
- `createAnnotation` — POST, invalidates `[Annotations]`.
- `updateAnnotation` — PATCH, invalidates `[Annotations]`.
- `deleteAnnotation` — DELETE, invalidates `[Annotations]`.
- `reorderAnnotations` — PUT `/reorder`, invalidates `[Annotations]`.

Add tags `Comments`, `Annotations` to `client/src/app/api/tags.ts`.

---

## 2. Viewer Class Extensions

### `World.ts` — Add annotation marker management

```ts
// Add to World class
private markers: Map<string, THREE.Object3D> = new Map();

public spawnMarker(id: string, pos: THREE.Vector3): void {
  const geo = new THREE.SphereGeometry(0.02, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  mesh.userData.markerId = id;
  this.scene.add(mesh);
  this.markers.set(id, mesh);
}

public removeMarker(id: string): void {
  const mesh = this.markers.get(id);
  if (mesh) {
    this.scene.remove(mesh);
    this.markers.delete(id);
  }
}

public clearMarkers(): void {
  for (const id of this.markers.keys()) this.removeMarker(id);
}
```

### `Viewer.ts` — Add interaction modes and raycasting

Add an `interactionMode` concept:

```ts
type ViewerMode = 'view' | 'comment' | 'annotate';
```

**New methods on `Viewer`:**

```ts
public setMode(mode: ViewerMode): void
```
- In `comment` mode: the next pointer-down on the model surface places a comment marker.
- In `annotate` mode: same but for annotation placement.
- In `view` mode: normal camera controls.

```ts
public onScenePointerDown(callback: (worldPos: THREE.Vector3, cameraPos: THREE.Vector3) => void): void
```
- Registers a one-shot callback (cleared after first invocation unless in annotate mode).
- Performs raycast against loaded model mesh(es).
- If hit → invoke callback with hit point and current camera position.

```ts
public highlightMarker(id: string | null): void
```
- Highlights the marker sphere with `color: 0xff5500` when `id` is non-null.
- Resets to `0xffaa00` on `null`.

Implementation detail: attach a `pointermove` listener to the renderer canvas for
`comment`/`annotate` modes that shows a crosshair cursor (`cursor: 'crosshair'`).

### New `useViewerReviews.ts` hook

Lives at `client/src/widgets/Model3DViewer/hooks/useViewerReviews.ts`.

```ts
export function useViewerReviews(viewer: Viewer | null, modelId: string) {
  const { data: annotations } = useModelAnnotationsQuery({ modelId });
  const { data: comments } = useModelCommentsQuery({ modelId });
  const [pendingPos, setPendingPos] = useState<THREE.Vector3 | null>(null);

  // Sync annotation markers into the viewer
  useEffect(() => {
    if (!viewer || !annotations) return;
    viewer.world.clearMarkers();
    for (const ann of annotations) {
      viewer.world.spawnMarker(ann.id, new THREE.Vector3(ann.posX, ann.posY, ann.posZ));
    }
  }, [viewer, annotations]);

  function startCommentPlacement() {
    viewer?.setMode('comment');
    viewer?.onScenePointerDown((worldPos) => {
      setPendingPos(worldPos);
      viewer.setMode('view');
    });
  }

  return { pendingPos, clearPending: () => setPendingPos(null), startCommentPlacement };
}
```

---

## 3. `ReviewPanel` Widget

**Directory:** `client/src/widgets/ReviewPanel/`

```
ReviewPanel/
├── index.tsx
├── ReviewPanel.tsx
├── ReviewPanel.module.scss
└── components/
    ├── CommentThread.tsx
    └── CommentInput.tsx
```

### `ReviewPanel.tsx`

Props: `modelId: string`.

- Calls `useModelCommentsQuery`.
- Groups comments into threads (root comments + their children).
- Renders each thread as a collapsible group (`Accordion`).
- `CommentThread` shows the root comment + replies indented.
- Add-reply button on each thread opens `CommentInput`.
- "Place comment" button calls `startCommentPlacement()` from `useViewerReviews`.
  Once position is captured, opens `CommentInput` pre-filled with position.
- If user is workspace admin → shows resolve/delete on all comments; otherwise only their own.

### `CommentInput.tsx`

Small form with `Textarea` + submit. Calls `useAddCommentMutation`.

### Styling

Panel slides in from right (Mantine `Drawer` component), triggered by a toolbar button in the viewer. Width: 360px.

---

## 4. `AnnotationManager` Widget

**Directory:** `client/src/widgets/AnnotationManager/`

```
AnnotationManager/
├── index.tsx
├── AnnotationManager.tsx
├── AnnotationManager.module.scss
└── components/
    ├── AnnotationList.tsx
    └── AnnotationCard.tsx
```

### `AnnotationManager.tsx`

Props: `modelId: string`, `canEdit: boolean`.

- Calls `useModelAnnotationsQuery`.
- Lists annotations ordered by `order`.
- Each `AnnotationCard` has: number badge, label, optional body (expandable), camera-fly-to button.
- "Add annotation" button (if `canEdit`) → triggers placement in `Viewer` via `useViewerReviews`,
  then opens a modal for `label` + `body`.
- Drag-and-drop reorder (Mantine DnD or HTML5 drag) → calls `useReorderAnnotationsMutation`.
- Click on a card → calls `viewer.camera.flyTo(cameraPosX, cameraPosY, cameraPosZ)` and
  `viewer.highlightMarker(annotation.id)`.

### Camera Fly-To

Add method to `CameraController.ts`:
```ts
public flyTo(x: number, y: number, z: number): void {
  this.controls.setLookAt(x, y, z, 0, 0, 0, true); // true = animate
}
```

---

## 5. Integrate into Editor Page

In `client/src/pages/Editor/`:
- Add a toolbar button "Comments" → opens/closes `ReviewPanel` drawer.
- Add a toolbar button "Annotations" → opens/closes `AnnotationManager` drawer.
- Pass `viewer` instance from `useViewer()` hook to both.

---

## Verification

1. Click "Place comment" → cursor becomes crosshair. Click on model → comment panel opens with position pre-filled.
2. Submit comment → appears in the panel with author and timestamp.
3. Annotation placed → yellow sphere appears in viewer at correct world position.
4. Click annotation in list → camera flies to saved position; sphere turns orange.
5. Drag to reorder → order persists after page reload.
6. Non-member user → "Place comment" button hidden; existing comments visible (on public models).
