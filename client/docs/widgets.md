# Widgets Catalogue

Widgets live in `src/widgets/`. Each widget is a composite, reusable UI block that may combine Mantine components, RTK Query hooks, and local state. Widgets **must not** import from `pages/`.

Every widget exposes its public API through an `index.ts` or `index.tsx` barrel file.

---

## Layout

### `layouts`

**Path:** `src/widgets/layouts/`

Layout wrapper components used to structure page content areas (e.g. centred content column, split panels). Consumed by `pages/` to enforce consistent spacing.

---

### `Header`

**Path:** `src/widgets/Header/`

Global site header rendered inside `BasePage`. Includes the `Logo`, navigation links, user avatar/menu, and the `ColorSchemeSelect` + `ColorThemeSwitcher` controls. Reads auth state from `useCurrentUserQuery`.

---

### `Footer`

**Path:** `src/widgets/Footer/`

Global site footer rendered inside `BasePage`. Contains copyright text and supplementary links.

---

### `Logo`

**Path:** `src/widgets/Logo/`

The MeshHub brand logo component. Renders as a link to `/`. Accepts size/variant props for use in different layout contexts (header, auth pages).

---

## User & Auth

### `Avatar`

**Path:** `src/widgets/Avatar/`

Displays a user avatar image. Falls back to initials when no `avatar` URL is set. Used in the header, user sidebar, and model cards.

---

### `UserSidebar`

**Path:** `src/widgets/UserSidebar/`

Left-side navigation panel for the `/user` section. Contains links to Profile, Settings, and the user's model list. Highlights the active route.

---

### `ChangeAvatarModal`

**Path:** `src/widgets/ChangeAvatarModal/`

Modal dialog for uploading a new avatar image. Uses `@mantine/dropzone` for file selection and calls `useUpdateCurrentUserAvatarMutation`.

---

### `ChangePasswordModal`

**Path:** `src/widgets/ChangePasswordModal/`

Modal dialog for changing the current user's password. Form is validated with Zod. Calls `useChangePasswordMutation`.

---

### `SessionTable`

**Path:** `src/widgets/SessionTable/`

Paginated table (powered by `mantine-datatable`) listing all active sessions for the current user. Each row shows device info parsed by `ua-parser-js` (IP, user-agent, created/expire dates) and a delete button that calls `useCloseCurrentUserSessionMutation`.

---

## 3D Models

### `Model3DViewer`

**Path:** `src/widgets/Model3DViewer/`

The primary interactive 3D model viewer. Wraps the Three.js class layer in a React component with a top bar, bottom bar, fullscreen support, and a context provider.

**Props** (`Model3DPageViewerProps` = `UseViewerProps`):

| Prop | Type | Required | Description |
|---|---|---|---|
| `model` | `Model3DResponseDto \| null` | Yes | Model data to load and display |
| `onInit` | `(viewer: Viewer) => void \| Promise<void>` | No | Called after the viewer is initialised |
| `onReady` | `(viewer: Viewer) => void \| Promise<void>` | No | Called after the model is loaded and the camera is positioned |
| `onDestroy` | `(viewer?: Viewer) => void \| Promise<void>` | No | Called before the viewer is destroyed |

See [`3d-viewer.md`](3d-viewer.md) for the full architecture.

---

### `Models3DList`

**Path:** `src/widgets/Models3DList/`

Responsive grid/list of model cards. Accepts a paginated array of `Model3DResponseDto` items and renders thumbnails, names, owner info, and category badges. Used on both the public main page and the user's own models page.

---

### `Upload3DModelModal`

**Path:** `src/widgets/Upload3DModelModal/`

Modal dialog for uploading a new 3D model file. Accepts `.glb` files via `@mantine/dropzone`. Calls `useUpload3DModelMutation` with a `FormData` payload. On success, navigates to the editor for the new model.

---

## UI Primitives

### `EmptyData`

**Path:** `src/widgets/EmptyData/`

A generic empty-state illustration + message component. Shown when a list or query result is empty. Accepts a customisable message prop.

---

### `Errors`

**Path:** `src/widgets/Errors/`

A collection of pre-built error state components:
- `NotFoundError` — 404 illustration and message
- `ForbiddenError` — 403 state
- `ServiceUnavailableError` — 503 state

Used within pages and by `ErrorPage` to display contextual error UI.

---

### `BaseErrorBoundary`

**Path:** `src/widgets/BaseErrorBoundary/`

React error boundary used as the `ErrorBoundary` on the root `BasePage` route. Catches unhandled render errors in the `BasePage` subtree and displays a fallback error UI instead of a blank page.

---

### `NumberInputSlider`

**Path:** `src/widgets/NumberInputSlider/`

Composite input combining a Mantine `NumberInput` and a `Slider` that stay in sync. Used in the 3D editor's renderer and scene settings panels to control numeric values (e.g. light intensity, exposure).

**Props:**
| Prop | Type | Description |
|---|---|---|
| `value` | `number` | Current value |
| `onChange` | `(v: number) => void` | Change handler |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
| `step` | `number` | Step increment |

---

### `PhoneInput`

**Path:** `src/widgets/PhoneInput/`

Phone number input with masked formatting powered by `react-imask`. Used in the Profile edit form.

---

### `ColorSchemeSelect`

**Path:** `src/widgets/ColorSchemeSelect/`

Light / Dark mode toggle control. Reads and sets the Mantine color scheme.

---

### `ColorThemeSwitcher`

**Path:** `src/widgets/ColorThemeSwitcher/`

Palette selector UI. Dispatches `userActions.setTheme(name)` to switch between the 7 available `ThemeName` values.

---

### `WysiwygEditor`

**Path:** `src/widgets/WysiwygEditor/`

Rich text editor built on **Tiptap** with the `@mantine/tiptap` toolbar integration. Supports bold, italic, underline, strikethrough, highlight, superscript, subscript, links, text alignment, and placeholder text. Used in the model description field on the detail/editor pages.

**Extensions enabled:** `StarterKit`, `Underline`, `Link`, `Superscript`, `Subscript`, `Highlight`, `TextAlign`, `Placeholder`.

