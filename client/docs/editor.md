# Editor Page

The `EditorPage` is the interactive 3D model editor. It is mounted **outside** the `BasePage` layout shell, giving it full control over the viewport. It provides inspector-style controls for scene objects, renderer settings, layer visibility, and model metadata editing.

**Route:** `/editor/:id`
**File:** `src/pages/Editor/index.tsx`

---

## Shell Structure

`EditorPage` uses its own Mantine `AppShell` configured with fixed-height header and footer and a collapsible sidebar navbar:

```tsx
<Model3DContextProvider model={model3d}>
  <AppShell
    header={{ height: rem(30) }}
    footer={{ height: rem(26) }}
    navbar={{ width: 360, breakpoint: 'sm', collapsed: { mobile: true } }}
  >
    <Header   />   {/* top bar — screenshot, model name */}
    <Navbar   />   {/* right-side inspector — RendererTab / SceneTab */}
    <Main     />   {/* centre — Model3DViewer canvas */}
    <Footer   />   {/* bottom bar — renderer info, stats */}
  </AppShell>
  <LoadingOverlay visible={isModelLoading || isViewerLoading} />
</Model3DContextProvider>
```

If the model ID from the URL does not resolve to a valid model, `NotFoundError` is shown instead of the shell.

---

## Data Flow

```
useParams({ id })
  └─ useModel3D({ id })          ← entities/model-3d hook → useModel3DQuery (RTK Query)
       └─ model3d: Model3DResponseDto | null

  └─ useEditor()
       └─ viewer: Viewer | null
       └─ isViewerLoading: boolean
       └─ onViewerReady(viewer)   ← passed to <Main> → <Model3DViewer onReady={...} />

Model3DContextProvider
  └─ provides model3d to all editor sub-components via React context
```

---

## `useEditor` Hook

**File:** `src/pages/Editor/hooks/useEditor.ts`

Manages the `Viewer` instance at the page level and spawns debug helpers when the viewer becomes ready.

```ts
function useEditor(): {
  viewer: Viewer | null;
  isViewerLoading: boolean;
  onViewerReady: (newViewer: Viewer) => void;
}
```

### `onViewerReady` callback

Called by `<Main>` when `Model3DViewer` fires its `onReady` prop. Stores the `Viewer` instance in state and increments an internal `key` counter to trigger the helpers effect.

### Helpers Effect

Runs whenever `viewer`, `key` (model reload counter), `isLight` (color scheme), or `theme` changes. Calls `addHelpers(viewer, isLight, theme)`.

### `addHelpers` utility

**File:** `src/pages/Editor/hooks/useEditor.ts` (exported)

```ts
function addHelpers(viewer: Viewer | null, isLight: boolean, theme: MantineTheme): void
```

Spawns all four debug overlays scaled to the loaded model's bounding box:

| Helper | Method | Notes |
|---|---|---|
| Grid | `world.spawnGridHelper(50, 50, color1, color2)` | Colors adapt to light/dark scheme |
| Axis | `world.spawnAxisHelper(max(1.25, bbLength × 0.1))` | Size proportional to model |
| Ground plane | `world.spawnGroundHelper(bbLength × 10, bbLength × 10)` | Shadow-receiving |
| Bounding box | `world.spawnSceneBoundingBoxHelper(bb, color1)` | Wireframe outline |

After spawning helpers, `camera.enableLayer([10])` is called to make them visible.

---

## Component Tree

```
EditorPage
├─ Header                       ← src/pages/Editor/components/Header/
├─ Navbar                       ← src/pages/Editor/components/Navbar/
│   ├─ RendererTab              ← Navbar/components/RendererTab/
│   └─ SceneTab                 ← Navbar/components/SceneTab/
│       ├─ Object3DOutliner     ← components/Object3DOutliner/
│       │   └─ Tree → Node → Group / Leaf
│       ├─ Object3DForm         ← components/Forms/Object3DForm/
│       │   └─ ScalarField / Vector3Field
│       └─ LayersCheckboxGroup  ← components/LayersCheckboxGroup/
├─ Main                         ← src/pages/Editor/components/Main/
│   └─ Model3DViewer (widget)
└─ Footer                       ← src/pages/Editor/components/Footer/
```

---

## Components

### `Header`

**Path:** `src/pages/Editor/components/Header/`

A minimal top bar (`height: rem(30)`). Displays the model name. Provides a screenshot button that calls `viewer.renderer.getScreenshot()` and triggers a PNG download.

---

### `Navbar`

**Path:** `src/pages/Editor/components/Navbar/`

The main inspector panel (`width: 360px`). Contains a tab switcher between **RendererTab** and **SceneTab**.

#### `RendererTab`

**Path:** `Navbar/components/RendererTab/`

Controls for `WebGLRenderer` settings. Reads initial values from `viewer.renderer.getSettings()` and applies changes via `viewer.renderer.setSettings(...)`.

Settings exposed:
- Tone mapping type + exposure
- Shadow map type (None / Basic / PCF / PCFSoft / VSM)
- Output color space
- Clear color + alpha

Uses `NumberInputSlider` from the widgets layer for numeric settings.

#### `SceneTab`

**Path:** `Navbar/components/SceneTab/`

Inspector for the currently selected `Object3D` in the scene. Shows:
- `Object3DOutliner` — tree view of the scene hierarchy
- `Object3DForm` — property form for the selected object
- `LayersCheckboxGroup` — layer visibility toggles

---

### `Object3DOutliner`

**Path:** `src/pages/Editor/components/Object3DOutliner/`

A tree view component that renders the Three.js scene hierarchy. Subscribes to the `World`'s `WorldSceneChange` event to re-render when the scene changes.

Sub-components in `components/`:

| Component | Description |
|---|---|
| `Tree` | Root tree renderer — iterates top-level scene children |
| `Node` | Renders a single `Object3D` node — delegates to `Group` or `Leaf` |
| `Group` | Collapsible branch for `Object3D` nodes that have children |
| `Leaf` | Terminal node for meshes and other leaf objects |
| `Header` | Outliner panel header with collapse/expand all controls |

---

### `Object3DForm`

**Path:** `src/pages/Editor/components/Forms/Object3DForm/`

Property inspector for the currently selected `Object3D`. Displays and edits:
- `position` — `Vector3Field`
- `rotation` — `Vector3Field`
- `scale` — `Vector3Field`
- `visible` — checkbox

Uses Mantine `@mantine/form` for controlled state with Zod schema validation.

---

### `Fields`

**Path:** `src/pages/Editor/components/Fields/`

Low-level field components used by `Object3DForm`:

#### `ScalarField`

A labelled `NumberInput` that also responds to mouse wheel scroll to increment/decrement the value. Uses the `useChangeScalarOnWheel` hook.

#### `Vector3Field`

Three `ScalarField` components arranged in a row for editing `{ x, y, z }` values. Used for position, rotation (in degrees, converted to radians internally), and scale.

---

### `LayersCheckboxGroup`

**Path:** `src/pages/Editor/components/LayersCheckboxGroup/`

A group of checkboxes mapped to Three.js camera layer numbers. Toggling a checkbox calls `viewer.camera.enableLayer` or `viewer.camera.disableLayer`.

---

### `CollapseSection`

**Path:** `src/pages/Editor/components/CollapseSection/`

A generic collapsible section wrapper used throughout the Navbar tabs. Renders a labelled header button and a Mantine `Collapse` panel.

---

### `Footer`

**Path:** `src/pages/Editor/components/Footer/`

A minimal bottom bar (`height: rem(26)`). Displays live WebGL renderer statistics (draw calls, triangle count, textures) read from `viewer.renderer.getInfo()`.

---

## `Model3DContext`

**File:** `src/shared/contexts/Model3DContext/`

A React context that carries `Model3DResponseDto | null` down the editor's component tree without prop drilling. Provided at the `EditorPage` root; consumed by any editor sub-component that needs model metadata (name, description, categories, ownership, etc.).

```tsx
// Providing
<Model3DContextProvider model={model3d}>
  ...
</Model3DContextProvider>

// Consuming (example)
const model = useModel3DContext();
```

---

## Hooks

### `useChangeScalarOnWheel`

**File:** `src/pages/Editor/hooks/useChangeScalarOnWheel.ts`

Returns an `onWheel` event handler that increments or decrements a numeric value by the field's configured step when the user scrolls over a `ScalarField`.

---

## `model.ts` Files

Each sub-component that needs its own TypeScript types defines them in a local `model.ts` file (never re-exported):

| File | Contents |
|---|---|
| `hooks/model.ts` | Editor hook state types |
| `components/Navbar/model.ts` | Navbar tab enum / state |
| `components/Navbar/components/RendererTab/model.ts` | Renderer settings form shape |
| `components/Navbar/components/SceneTab/model.ts` | Scene tab state types |
| `components/Object3DOutliner/model.ts` | Outliner node types |
| `components/Forms/Object3DForm/model.ts` | Object3D form schema |
| `components/CollapseSection/model.ts` | CollapseSection props |
| `components/LayersCheckboxGroup/model.ts` | Layer checkbox data |

