# Widgets Catalogue

Widgets live in `src/widgets/`. Each widget is a composite, reusable UI block that may combine Mantine components, RTK Query hooks, and local state. Widgets **must not** import from `pages/`.

Every widget exposes its public API through an `index.ts` or `index.tsx` barrel file.

The directory currently contains **28 entries** — 27 widgets plus the `layouts/` folder of layout wrappers.

---

## Top bar / Navigation

Widgets composed by the global `Header` and the user / org navigation chrome.

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `Header` | `src/widgets/Header/` | Global site header: brand, search, org switcher, color scheme toggle, notifications, auth/user menu. | `widgets/layouts/Base` | Mantine, RTK Query (`useSession`) |
| `Logo` | `src/widgets/Logo/` | MeshHub brand logo SVG, accepts `width`/`height`. | `Header`, auth pages | — |
| `OrgSwitcher` | `src/widgets/OrgSwitcher/` | Org selector dropdown; calls `useMyOrganizationsQuery` and switches active org. | `Header` | Mantine, RTK Query |
| `NotificationBell` | `src/widgets/NotificationBell/` | Bell icon + popover listing recent notifications, unread count polled every 60 s. Marks read on click and routes to scene/model/org. | `Header` | Mantine `Popover`/`Indicator`, `useGetNotificationsQuery`, `dayjs` |
| `SearchInput` | `src/widgets/SearchInput/` | Combobox-based global search across models and scenes; debounced 300 ms, queries `useModels3DQuery` + `useScenesQuery`. | `Header` (visible from `md` breakpoint) | Mantine `Combobox`, RTK Query |
| `ColorSchemeSelect` | `src/widgets/ColorSchemeSelect/` | Light/dark Mantine color scheme toggle. | `Header`, Editor header | Mantine `useMantineColorScheme` |
| `ColorThemeSwitcher` | `src/widgets/ColorThemeSwitcher/` | Palette selector; dispatches `userActions.setTheme(name)` across the 7 `ThemeName` values. | `pages/Editor` footer, User Settings page | Redux (`userSlice`) |
| `UserSidebar` | `src/widgets/UserSidebar/` | Left navigation panel for the `/user` section (Profile, Settings, models). Highlights active route. | `widgets/layouts/User` | React Router, Mantine `NavLink` |

---

## Layouts

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `layouts` | `src/widgets/layouts/` | Three layout wrappers: `BaseLayout` (global `AppShell` with `Header` + `Footer`), `AuthLayout` (centered `Paper` for login/register), `UserLayout` (`UserSidebar` + content column). | `pages/` route components | Mantine `AppShell` |
| `Footer` | `src/widgets/Footer/` | Global site footer with copyright text and supplementary links. | `widgets/layouts/Base` | Mantine |

---

## Auth & Profile modals

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `ChangeAvatarModal` | `src/widgets/ChangeAvatarModal/` | Modal for uploading a new avatar via dropzone. Calls `useUpdateCurrentUserAvatarMutation`. | `widgets/Avatar` | Mantine `Modal`, `@mantine/dropzone`, RTK Query |
| `ChangePasswordModal` | `src/widgets/ChangePasswordModal/` | Modal to change the current user's password; Zod-validated form, `useChangePasswordMutation`. | `pages/User/pages/Profile` | Mantine `Modal`, Zod, RTK Query |

---

## 3D & Editor

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `Model3DViewer` | `src/widgets/Model3DViewer/` | Primary interactive 3D viewer. Wraps the Three.js class layer (`Viewer`, `CameraController`, `Renderer`, `World`, `MeasureTool`) in a React component with top/bottom bars, fullscreen, and a context provider. See [`3d-viewer.md`](3d-viewer.md). | `pages/Models3D/Model3D`, `pages/Editor`, `pages/EmbedViewer` | Three.js, React |
| `AnnotationManager` | `src/widgets/AnnotationManager/` | Manages model-level 3D annotation pins. Highlights points via `Viewer.setSelectedObject`; supports create/edit/delete and drag reorder. | `pages/Models3D/Model3D`, `pages/Editor` Navbar | `@dnd-kit`, Mantine, RTK Query |
| `SceneAnnotationManager` | `src/widgets/SceneAnnotationManager/` | Scene-level annotations: places pins by clicking the scene (`viewer.setMode('annotate')`), supports drag reorder, fly-to-camera, and read-only timeline mode. Operates on `sceneId` and a `Viewer` reference. | `pages/PublicScene`, `pages/SceneEditor` (`SceneReviewPanel`) | `@dnd-kit`, Three.js (`Vector3`), Mantine, RTK Query |
| `ReviewPanel` | `src/widgets/ReviewPanel/` | Composite review panel combining starred comments and annotation entries; provides comment add/edit forms. Uses `useModelCommentsQuery`, `useAddCommentMutation`, `useModelAnnotationsQuery`. | `pages/Models3D/Model3D`, `pages/Editor` Navbar, `pages/SceneEditor`, `pages/PublicScene` | Mantine, RTK Query |

`MeasureTool` lives at `src/widgets/Model3DViewer/classes/MeasureTool/` — it is internal to the viewer, not a top-level widget.

---

## Lists / Data display

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `Models3DList` | `src/widgets/Models3DList/` | Responsive grid of model cards (thumbnail, name, owner, category badges) over a paginated `Model3DResponseDto[]`. | `pages/Main`, `pages/UserModels3D` | Mantine |
| `EmptyData` | `src/widgets/EmptyData/` | Generic empty-state illustration + label, used wherever a list/query yields no rows. | `NotificationBell`, `SceneAnnotationManager`, dashboards, editor panels | Mantine |
| `SessionTable` | `src/widgets/SessionTable/` | Paginated table of the current user's active sessions; parses UA via `ua-parser-js` and offers row-level revoke (`useCloseCurrentUserSessionMutation`). | `pages/User/pages/Settings` | `mantine-datatable`, `ua-parser-js`, RTK Query |
| `VersionHistory` | `src/widgets/VersionHistory/` | Lists model upload versions with size/date/active flag. Supports upload (`useUploadVersionMutation`), activate (`useActivateVersionMutation`), delete (`useDeleteVersionMutation`). | `pages/Models3D/Model3D`, `pages/Editor` Navbar | Mantine, RTK Query |
| `QuotaBar` | `src/widgets/QuotaBar/` | Storage quota progress bar driven by `useGetOrgSubscriptionQuery`; renders used/total via `formatBytes`. | `pages/OrgDashboard` | Mantine `Progress`, RTK Query |

---

## Form controls

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `NumberInputSlider` | `src/widgets/NumberInputSlider/` | Composite numeric input pairing a Mantine `NumberInput` and `Slider` that stay in sync. Used for renderer/scene/material settings (intensity, exposure, etc.). | `pages/Editor` Navbar tabs (Materials, Display, Lights), `pages/SceneEditor` panels | Mantine `NumberInput`, `Slider` |
| `PhoneInput` | `src/widgets/PhoneInput/` | Phone number input with masked formatting. | `pages/User/pages/Profile` | `react-imask` |
| `WysiwygEditor` | `src/widgets/WysiwygEditor/` | Rich text editor on Tiptap with `@mantine/tiptap` toolbar — bold/italic/underline/strike/highlight/super/sub/link/text-align/placeholder. Used for model description fields. | `pages/Models3D/Model3D` `EditPropertiesDrawer` | Tiptap (`StarterKit`, `Underline`, `Link`, `Superscript`, `Subscript`, `Highlight`, `TextAlign`, `Placeholder`), `@mantine/tiptap` |

---

## Upload modals

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `Upload3DModelModal` | `src/widgets/Upload3DModelModal/` | Modal for uploading a new 3D model (`.glb`/`.gltf`/`.fbx`/`.obj`/`.dae`/`.stl`/`.zip`). Posts via the `uploadModel3DWithProgress` XHR helper (so the Mantine `Progress` bar advances on > 10 MB files), invalidates `CurrentUser3DModels` + `Get3DModels` tags, and routes to the editor for the new model. Shows a context tip when an `.obj` is selected. | `pages/UserModels3D` | Mantine `Modal`/`Progress`, `@mantine/dropzone` |

---

## Error / Boundary

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `BaseErrorBoundary` | `src/widgets/BaseErrorBoundary/` | React error boundary used as the route `ErrorBoundary` on `BaseLayout`. Catches unhandled render errors and falls back to `NotFoundError`. | `app/router` (root route) | React error boundaries |
| `Errors` | `src/widgets/Errors/` | Pre-built error states: `BadRequestError`, `NotFoundError`, `ForbiddenError`, `ServiceUnavailableError`. | `pages/Error`, `pages/Editor`, `BaseErrorBoundary` | Mantine, illustrations |

---

## Misc

| Widget | Path | Purpose | Mounted by | Key deps |
|---|---|---|---|---|
| `Avatar` | `src/widgets/Avatar/` | User avatar with initials fallback, hover overlay with edit/delete actions. Owns and opens `ChangeAvatarModal`. Calls `useUpdateCurrentUserAvatarMutation` for delete. | `widgets/UserSidebar` (and other user-card surfaces) | Mantine `Avatar`/`Overlay`, RTK Query |

---

## Cross-references

- [`3d-viewer.md`](3d-viewer.md) — full architecture of `Model3DViewer` and its Three.js class layer.
- [`editor.md`](editor.md) — model editor page that mounts `Model3DViewer`, `AnnotationManager`, `ReviewPanel`, `VersionHistory`, `NumberInputSlider`, `ColorThemeSwitcher`.
- [`scene-editor.md`](scene-editor.md) — scene editor that mounts `Model3DViewer` and `SceneAnnotationManager`/`ReviewPanel` via `SceneReviewPanel`.
- [`organization-dashboard.md`](organization-dashboard.md) — uses `OrgSwitcher` (in the header) and `QuotaBar`.
- [`notifications.md`](notifications.md) — backend + transport feeding `NotificationBell`.
