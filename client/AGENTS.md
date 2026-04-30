# AGENTS.md — MeshHub Client

LLM-oriented reference for the `client/` React SPA. Read this before making any code changes.

---

## Project Identity

- **Name:** `mesh-hub-client`
- **Framework:** React 19 + TypeScript 6
- **Architecture:** Feature-Sliced Design (FSD)
- **State:** Redux Toolkit + RTK Query + redux-persist
- **UI:** Mantine v9
- **3D:** Three.js via custom class layer (`Model3DViewer`)
- **Backend:** NestJS REST API at `../server/` (modules: `auth`, `user`, `models-3d`, `files`, `resources`, `notifications`, `organizations`, `workspaces`, `embed`, `scenes`, `api-keys`, `webhooks`, `storage-quota`, `subscriptions`, `mailing`, `config`, `database`, `swagger`)

---

## Path Alias

```ts
// tsconfig.app.json / vite.config.ts
'@' → 'src/'
```

Always use `@/` for cross-feature imports. Relative `./` imports are only acceptable within the same directory or sibling with max 2 levels.

---

## FSD Layer Rules

```
app  ←  widgets  ←  pages
         ↑             ↑
       entities      shared
         ↑
       shared
```

**Strict rules (never break):**

| Rule | Description |
|---|---|
| `shared` imports nothing from higher layers | No imports from `app`, `entities`, `pages`, `widgets` |
| `entities` imports only from `shared` | No imports from `pages`, `widgets` |
| `widgets` imports from `entities` and `shared` | Never from `pages` |
| `pages` imports from all layers below | No circular imports |
| `app` imports from all layers | Entry point only |

---

## UI/UX Conventions

Apply to **all** pages and panels. Follow without exception:

| Pattern | Mantine Component | When |
|---|---|---|
| Empty lists / grids | `EmptyData` widget (existing in `widgets/EmptyData/`) | When query returns 0 items |
| Loading cards / lists | `Skeleton` (same grid/list structure as data) | While `isLoading=true` |
| Full-page / panel loading | `LoadingOverlay` | Initial page load or in-flight uploads |
| Destructive actions | `modals.openConfirmModal()` | Delete, reset, revoke |
| Mutation errors | `notifications.show({ color: 'red', title: 'Error', message: ... })` | All RTK mutation failures |
| Icon-only buttons | Wrapped in `<Tooltip label="...">` | Every `ActionIcon` without visible text |
| Color pickers | `ColorInput` (Mantine) | All hex color fields |
| Float value sliders | `NumberInputSlider` widget (existing in `widgets/NumberInputSlider/`) | Combined slider + number input |
| Unsaved state indicator | Dirty `Badge` / `dot` on tab icon + `loading={isSaving}` on Save button | Forms with pending DB changes |
| Tab navigation (editors) | Icon-only `Tabs` with `Tooltip`, using `TabValues` const + `getTabsConfig()` helper | Both Model Editor and Scene Editor navbars |

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| React components | `PascalCase` file + named export | `UserSidebar.tsx` → `export function UserSidebar()` |
| Hooks | `camelCase`, must start with `use` | `useViewer.ts` → `export function useViewer()` |
| Local type/model file | `model.ts` per feature | `pages/Editor/hooks/model.ts` |
| Public re-export | `index.ts` or `index.tsx` at directory root | `widgets/Avatar/index.tsx` |
| SCSS modules | `ComponentName.module.scss` | `Viewer.module.scss` |
| Constants | `UPPER_SNAKE_CASE` values, `PascalCase` object | `RouterPaths.Base = '/'` |

---

## RTK Query Pattern

All API endpoints are injected into a single base `Api` instance:

```ts
// src/app/api/base.ts
export const Api = createApi({ reducerPath: '@mesh_hub/api', ... });

// src/app/api/auth.ts
export const AuthApi = Api.injectEndpoints({
  endpoints: (build) => ({ ... }),
  overrideExisting: true,  // ← always required
});
```

- **Never** create a second `createApi` instance.
- Always set `overrideExisting: true` in `injectEndpoints`.
- Export generated hooks directly from the module file (e.g. `export const { useLoginMutation } = AuthApi`).

Endpoint files (one per feature area) live in `src/app/api/`:

| File | Coverage |
|---|---|
| `auth.ts` | login / register / refresh / sessions / password reset |
| `user.ts` | current user, avatar, profile updates |
| `models-3d.ts` | catalog + per-user 3D model lists, upload, delete, thumbnail |
| `display-config.ts` | model display config (post-FX, lights, camera defaults) |
| `materials.ts` | material/texture overrides |
| `audio.ts` | model-attached audio sources |
| `versions.ts` | model version history (upload / activate / delete) |
| `reviews.ts` | model comments + annotations |
| `resources.ts` | shared lookup data (categories, CGSoft) |
| `organizations.ts` | organizations, members, subscription plan, quota |
| `workspaces.ts` | per-org workspaces |
| `embed.ts` | embed projects + public embed config |
| `scenes.ts` | scene CRUD, scene objects, lights, sharing |
| `scene-reviews.ts` | scene comments + annotations |
| `notifications.ts` | in-app notifications, unread counter |
| `webhooks.ts` | per-org webhook subscriptions + delivery log |
| `api-keys.ts` | per-org programmatic access keys |

---

## Cache Tags (`ApiTags`)

Defined in [src/app/api/tags.ts](src/app/api/tags.ts). 30 tag keys (29 unique values — `Get3DModel` and `Get3DModels` deliberately share the value `'Get3DModels'`). Every endpoint must declare `providesTags` (queries) or `invalidatesTags` (mutations) using these constants — **never** raw strings.

```ts
export const ApiTags = {
  Reset:               'Reset',                  // global invalidation sentinel
  // User
  CurrentUser:         'CurrentUser',
  CGSoft:              'CGSoft',
  // Models — catalog + current-user split
  Categories:          'Categories',
  Get3DModels:         'Get3DModels',
  Get3DModel:          'Get3DModels',             // ⚠ same value as Get3DModels (intentional)
  CurrentUser3DModels: 'CurrentUser3DModels',
  CurrentUser3DModel:  'CurrentUser3DModel',
  // Model display / materials / audio / versions
  DisplayConfig:       'DisplayConfig',
  Materials:           'Materials',
  ModelAudio:          'ModelAudio',
  ModelVersions:       'ModelVersions',
  // Organizations & workspaces
  Organization:        'Organization',
  OrgMembers:          'OrgMembers',
  OrgSubscription:     'OrgSubscription',
  Workspaces:          'Workspaces',
  Workspace:           'Workspace',
  // Embed
  EmbedProjects:       'EmbedProjects',
  EmbedProject:        'EmbedProject',
  // Scenes
  Scenes:              'Scenes',
  Scene:               'Scene',
  SceneAnnotations:    'SceneAnnotations',
  SceneComments:       'SceneComments',
  // Reviews (model)
  Comments:            'Comments',
  Annotations:         'Annotations',
  // Notifications
  Notification:        'Notification',
  NotificationCount:   'NotificationCount',
  // Webhooks
  Webhook:             'Webhook',
  WebhookDeliveries:   'WebhookDeliveries',
  // Programmatic access
  ApiKey:              'ApiKey',
} as const;
```

`Reset` is a sentinel: invalidating it forces every query that lists it under `providesTags` to refetch. Use only for hard cross-cutting resets (e.g. all-sessions logout).

**Invalidation map (by feature area):**

| Feature | Mutations | Invalidates |
|---|---|---|
| Auth | `register` / `login` / `logout` / `closeCurrentUserSessions` | `Reset`, `CurrentUser` |
| User profile | `updateCurrentUser`, `updateCurrentUserAvatar` | `CurrentUser`, `CGSoft` (on profile) |
| Models | `upload3DModel`, `delete3DModel`, `saveThumbnail` | `CurrentUser3DModels`, `Get3DModels` |
| Models | `updateModel3D` | `Get3DModels`, `Get3DModel:{id}` |
| Display config | `updateDisplayConfig` | `DisplayConfig:{modelId}` |
| Materials | material/texture mutations | `Materials:{modelId}` |
| Audio | add / update / delete audio | `ModelAudio:{modelId}` |
| Versions | upload / activate / delete | `ModelVersions:{modelId}`, `Get3DModel:{id}` |
| Reviews (model) | add / update / delete comment, annotation CRUD | `Comments:{modelId}`, `Annotations:{modelId}` |
| Organizations | create / update / delete org, member CRUD | `Organization`, `OrgMembers`, `OrgSubscription` |
| Workspaces | create / update / delete workspace | `Workspaces:{orgId}`, `Workspace:{id}` |
| Embed | create / update / delete project | `EmbedProjects:{orgId}`, `EmbedProject:{id}` |
| Scenes | create / update / delete scene + scene objects | `Scenes:{workspaceId}`, `Scene:{id}` |
| Scene reviews | comment / annotation CRUD | `SceneComments:{sceneId}`, `SceneAnnotations:{sceneId}` |
| Notifications | mark read / mark all read | `Notification`, `NotificationCount` |
| Webhooks | create / update / delete / replay | `Webhook`, `WebhookDeliveries:{webhookId}` |
| API keys | create / revoke | `ApiKey:{orgId}` |

Tags that take an `id` are emitted as `{ type, id }` pairs — use `providesTags: (result, _err, arg) => [{ type: ApiTags.Scene, id: arg.id }]`.

---

## Auth Token Auto-Refresh Flow

Located in `src/app/api/base.ts`. Uses `async-mutex` to prevent concurrent refresh races.

```
Request → 401 or network error
  └─ mutex locked by another request? → wait, then retry original
  └─ mutex free? → acquire lock
       └─ POST auth/refresh
            ├─ success → dispatch setSession(id) → retry original request
            └─ failure → dispatch setSession(null) (clears session)
       └─ release lock
```

- `baseUrl` = `import.meta.env.VITE_APP_API_URL ?? '/'`
- Credentials: `include` (cookie-based sessions)
- Timeout: 30 000 ms

---

## Redux Store Shape

```ts
{
  '@mesh_hub/api': RtkQueryState,   // managed by RTK Query
  user: {
    session: string | null,          // current session ID
    theme: ThemeName,                // persisted color theme
  },
  organization: {
    currentOrgId:       string | null,
    currentWorkspaceId: string | null,
  }
}
```

- Persist key: `@mesh_hub/user` → `localStorage`
- Persist key: `@mesh_hub/organization` → `localStorage` (current org / workspace selection)
- `ThemeName`: `'deepblue' | 'bluegray' | 'darkpink' | 'skyblue' | 'green' | 'deeporange' | 'magenta'`
- Default theme: `'deepblue'`

---

## SCSS Global Mixins

All SCSS modules have these available globally (injected via `vite.config.ts` `additionalData` as `@use "src/shared/theme/_mantine" as *`):

```scss
@include light { }   // [data-mantine-color-scheme='light'] &
@include dark  { }   // [data-mantine-color-scheme='dark'] &
@include hover { }   // pointer + touch-safe hover
@include rtl   { }   // [dir='rtl'] &
@include ltr   { }   // [dir='ltr'] &

rem(16)  // → 1rem  (converts px to rem)

// Breakpoint variables (match Mantine theme)
$mantine-breakpoint-xs  // 36em  (576px)
$mantine-breakpoint-sm  // 48em  (768px)
$mantine-breakpoint-md  // 62em  (992px)
$mantine-breakpoint-lg  // 75em  (1200px)
$mantine-breakpoint-xl  // 88em  (1408px)
```

Do **not** `@use` or `@import` `_mantine.scss` — it is already injected with `as *`.

---

## `model.ts` Convention

Every feature that needs local TypeScript types creates a `model.ts` file at the feature root. This file is never re-exported from `index.ts` — it is consumed only within the feature.

```
pages/Editor/hooks/model.ts         ← Editor hook types
pages/Editor/components/Navbar/model.ts  ← Navbar-specific types
widgets/Model3DViewer/classes/types/ ← Viewer type layer
```

---

## Entities

Live under `src/entities/`. Pure data + Redux + lookup hooks; never render real UI (Avatar/UserSidebar are widgets, not entities).

| Entity | Purpose |
|---|---|
| `user` | Session redux slice (`session`, `theme`), `useCurrentUser` / `useSession` hooks, theme persistence |
| `model-3d` | `useModel3D` hook (load model + display config + materials in one call) consumed by Model3DViewer / Editor / Scene editor |
| `organization` | `currentOrgId` / `currentWorkspaceId` redux slice + selectors, persisted org/workspace selection driving the org-scoped routes |

---

## Pages

Mounted in [src/app/router/index.tsx](src/app/router/index.tsx). All non-base pages are lazy-loaded. Path constants live in [src/shared/router/paths.ts](src/shared/router/paths.ts).

| Page directory | Route | Purpose |
|---|---|---|
| `Base` | `/` | Top-level layout shell wrapping every authenticated route |
| `Main` | `/` (index) | Public 3D model catalog + pagination |
| `Auth` | `/auth/(login\|register\|reset-password\|new-password)` | Auth flows; redirects away if session is active |
| `Error` | `/:code?/*` | Bad request / forbidden / not found / service unavailable shells |
| `User` | `/user` | Personal area shell with sidebar; redirects to `/user/models-3d` |
| `UserModels3D` | `/user/models-3d` | Current user's models with drag-and-drop upload |
| `User/pages/Profile` | `/user/profile` | Profile editor (avatar, names, password) + open sessions |
| `User/pages/Settings` | `/user/settings` | Theme + color scheme |
| `User/pages/DevSandbox` | `/user/dev-sandbox` | Internal sandbox for component checks (dev only) |
| `UserScenes` | `/user/scenes` | Current user's personal scenes list |
| `Models3D` | `/models-3d` | Public catalog shell (Outlet wrapper) |
| `Models3D/pages/Model3D` | `/models-3d/:id` | Public model viewer with comments + annotations |
| `Editor` | `/editor/:id` | Standalone model editor (camera, lights, materials, post-FX, audio, versions) |
| `Scenes` | `/org/:orgId/workspace/:workspaceId/scenes` | Workspace-scoped scenes list with `CreateSceneModal` |
| `SceneEditor` | `/user/scenes/:sceneId` and `/org/:orgId/workspace/:workspaceId/scenes/:sceneId` | Scene editor (objects, lights, comments, annotations, sharing) |
| `PublicScene` | `/scenes/:sceneId` | Public read-only scene viewer |
| `OrgCreate` | `/org/create` | Organization onboarding form |
| `OrgDashboard` | `/org/:orgId` and `/org/:orgId/workspace/:workspaceId` | Org and workspace dashboards (members, quota, webhooks, API keys, embed projects) |
| `EmbedProject` | `/org/:orgId/embed/:projectId` | Embed project configuration page |
| `EmbedViewer` | `/embed/:modelId` | Public iframe-friendly viewer used by `<iframe src=…>` consumers |

---

## Widgets

Live under `src/widgets/`. 28 directories. Group, then alphabetic within group.

**Layouts (`widgets/layouts/`):** `BaseLayout`, `AuthLayout`, `UserLayout` — page chrome (header / sidebar / footer composition) imported by `pages/Base`, `pages/Auth`, `pages/User`.

**Navigation / chrome:**

| Widget | Purpose |
|---|---|
| `Header` | Top app bar: logo, org switcher, search, notifications, color scheme, auth buttons |
| `Footer` | Public footer (contacts, copyright) |
| `UserSidebar` | Personal-area left sidebar with avatar + nav links |
| `Logo` | Themed inline-SVG logo |
| `OrgSwitcher` | Header dropdown to pick current org / workspace (writes to `organization` redux slice) |
| `SearchInput` | Global search input rendered in header |
| `NotificationBell` | Header popover with unread notifications + mark-all-read |
| `QuotaBar` | Storage / object-count progress bar (shown in org dashboard) |

**Auth / user-data widgets:**

| Widget | Purpose |
|---|---|
| `Avatar` | Avatar with edit overlay; opens `ChangeAvatarModal`, supports delete |
| `ChangeAvatarModal` | Drop-zone upload modal for avatar (image, ≤1MB) |
| `ChangePasswordModal` | Password change form with current/new/confirm |
| `SessionTable` | Open auth sessions table with revoke + close-all |

**Catalogs and lists:**

| Widget | Purpose |
|---|---|
| `Models3DList` | Responsive grid of model cards with empty state |
| `EmptyData` | Themed inline-SVG empty placeholder |

**Modals (mutating):**

| Widget | Purpose |
|---|---|
| `Upload3DModelModal` | Drop-zone upload modal for new GLB/GLTF/etc. with progress |

**Editor utilities:**

| Widget | Purpose |
|---|---|
| `NumberInputSlider` | Combined slider + number input for float controls (used everywhere in editor) |
| `WysiwygEditor` | Mantine + Tiptap rich-text editor (descriptions, comments) |
| `ColorSchemeSelect` | Light / dark / auto switcher |
| `ColorThemeSwitcher` | Primary-color theme picker |
| `PhoneInput` | Masked phone-number input |

**Viewer + review surface:**

| Widget | Purpose |
|---|---|
| `Model3DViewer` | Three.js model viewer, see [Model3DViewer Class Stack](#model3dviewer-class-stack) |
| `AnnotationManager` | Drag-and-drop list + creation/editing of model 3D annotations (markers in viewer) |
| `SceneAnnotationManager` | Same for scene-scope annotations |
| `ReviewPanel` | Comment thread + annotation linking, shared between model and scene scopes (`scope: 'model' \| 'scene'`) |
| `VersionHistory` | Model version uploads / activate / delete |

**Boundaries / errors:**

| Widget | Purpose |
|---|---|
| `BaseErrorBoundary` | React Router `ErrorBoundary` for the root route |
| `Errors` | `BadRequestError`, `ForbiddenError`, `NotFoundError`, `ServiceUnavailableError` rendered by `pages/Error` |

---

## Model3DViewer Class Stack

Three.js logic lives in plain TS classes under [src/widgets/Model3DViewer/classes/](src/widgets/Model3DViewer/classes/). React touches them only via the hooks below.

| Class / module | Responsibility |
|---|---|
| `Viewer` | Top-level orchestrator; owns `World`, `CameraController`, `Renderer`, lifecycle |
| `World` | `THREE.Scene`, helpers (grid, axes), `WorldHelpers` toggles |
| `Camera` (`CameraController`) | Camera + `OrbitControls`, framing helpers |
| `Renderer` | `WebGLRenderer` + `EffectComposer` post-processing pipeline + `CSS2DRenderer` overlay (used for measurement / annotation labels) |
| `Lights` (`LightBuilder`) | Constructs ambient / directional / point / spot lights from config |
| `Loader` (`Loader`, `LoaderCache`) | GLTF/DRACO/KTX2 loading with cache; dispatches by extension |
| `MeasureTool` | On-canvas point-pair distance measurement with CSS2D labels |
| `Destroyer` | Disposes geometries, materials, textures, render targets, composer passes |
| `types/` | Shared types (`PostProcessConfig`, `RendererSettings`, `LoadedModel3D`, …) |
| `utils/` | Pure helpers (`isMesh`, etc.) — no THREE side effects |

**Renderer post-processing pipeline.** [Renderer.ts](src/widgets/Model3DViewer/classes/Renderer/Renderer.ts) wires up `EffectComposer` with a `RenderPass` and `OutputPass` baseline. `setPostProcessing(config)` dynamically (re)builds the chain from `PostProcessConfig`:

```
RenderPass → [SSAOPass] → [UnrealBloomPass] → [BokehPass]
           → [ShaderPass(VignetteShader)]
           → [ShaderPass(ColorCorrectionShader)]
           → OutputPass
```

Each pass is dynamically `import()`-ed only when enabled. `OutputPass` is always the last pass. All passes are disposed before the chain is rebuilt and again on `destroy()`.

**Hooks (in `widgets/Model3DViewer/hooks/`):**

| Hook | Purpose |
|---|---|
| `useViewer` | Mounts a `Viewer` against a div ref, applies model + display config + material overrides, exposes lifecycle callbacks |
| `useViewerContext` | Reads the `Viewer` instance out of `ViewerContextProvider` (used by bottom/top bar children) |
| `useViewerReviews` | Wires up annotation markers / comment hover state from RTK Query into the viewer |
| `useAnimations` | GLTF clip blending / autorun for animated models |
| `usePreventMiddleClick` | Suppresses native middle-click autoscroll over the viewer canvas |

---

## Documentation

Long-form docs in [docs/](docs/). Treat these as the deep-dive companions to this file.

| Doc | Scope |
|---|---|
| [docs/architecture.md](docs/architecture.md) | High-level FSD layout, dependency rules, build pipeline |
| [docs/routing.md](docs/routing.md) | Router, path constants, lazy loading |
| [docs/state-management.md](docs/state-management.md) | Redux slices, persistence, selectors |
| [docs/api.md](docs/api.md) | RTK Query base, endpoint files, refresh flow, cache tags |
| [docs/widgets.md](docs/widgets.md) | Per-widget contracts and conventions |
| [docs/3d-viewer.md](docs/3d-viewer.md) | Model3DViewer class stack and Three.js conventions |
| [docs/editor.md](docs/editor.md) | Standalone model editor (camera / lights / materials / post-FX / audio / versions) |
| [docs/scene-editor.md](docs/scene-editor.md) | Scene editor (multi-object scenes, lights, sharing, comments) |
| [docs/embed.md](docs/embed.md) | Embed projects + public viewer |
| [docs/organization-dashboard.md](docs/organization-dashboard.md) | Org/workspace dashboards, members, quota, webhooks, API keys |
| [docs/notifications.md](docs/notifications.md) | In-app notifications surface |
| [docs/theming.md](docs/theming.md) | Themes, SCSS mixins, color schemes |

---

## Key File Locations

| Concern | Path |
|---|---|
| App root component | `src/app/App.tsx` |
| Router definition | `src/app/router/index.tsx` |
| Redux store | `src/app/store/index.ts` |
| RTK Query base | `src/app/api/base.ts` |
| API URL constants | `src/app/api/urls.ts` |
| Cache tag constants | `src/app/api/tags.ts` |
| Hand-maintained client DTOs | `src/app/api/dto.ts` |
| Route path constants | `src/shared/router/paths.ts` |
| User Redux slice | `src/entities/user/store/reducer.ts` |
| Organization Redux slice | `src/entities/organization/model.ts` |
| Theme definition | `src/shared/theme/` |
| 3D Viewer entry | `src/widgets/Model3DViewer/index.tsx` |
| Viewer orchestrator class | `src/widgets/Model3DViewer/classes/Viewer/Viewer.ts` |
| Viewer renderer + post-FX | `src/widgets/Model3DViewer/classes/Renderer/Renderer.ts` |
| Model editor page | `src/pages/Editor/index.tsx` |
| Scene editor page | `src/pages/SceneEditor/SceneEditorPage.tsx` |
| Org dashboard page | `src/pages/OrgDashboard/OrgDashboard.tsx` |

---

## Testing

There are no client tests yet. When they are introduced, follow the monorepo rule: all specs live under `client/test/<kind>/` (e.g. `client/test/unit/`, `client/test/component/`, `client/test/e2e/`), each with its own runner config and an `npm` script. Specs are never co-located with the source they cover. See [server/AGENTS.md § Testing](../server/AGENTS.md#testing) for the existing backend layout.
