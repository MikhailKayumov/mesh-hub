# Routing

All routes are defined in `src/app/router/index.tsx` using React Router DOM v7's `createBrowserRouter`. Route path constants live in `src/shared/router/paths.ts` as the `RouterPaths` object.

---

## Route Path Constants

`client/src/shared/router/paths.ts` is the single source of truth for path segments. Build URLs from those constants instead of hard-coding strings.

```ts
// src/shared/router/paths.ts
export const RouterPaths = {
  // common
  Base:               '/',
  Models:             'models-3d',
  Id:                 ':id',

  // errors
  BadRequest:         'bad-request',
  NotFound:           'not-found',
  Forbidden:          'forbidden',
  ServiceUnavailable: 'service-unavailable',

  // auth
  Auth:               'auth',
  Login:              'login',
  Register:           'register',
  ResetPassword:      'reset-password',
  NewPassword:        'new-password',

  // user
  User:               'user',
  Profile:            'profile',
  Settings:           'settings',
  DevSandbox:         'dev-sandbox',
  UserScenes:         'scenes',

  // editor
  Editor:             'editor',

  // organizations
  Org:                'org',
  OrgId:              ':orgId',
  OrgCreate:          'create',
  WorkspaceSeg:       'workspace',
  WorkspaceId:        ':workspaceId',

  // embed
  Embed:              'embed',
  EmbedModelId:       ':modelId',
  EmbedProjectId:     ':projectId',

  // scenes
  Scenes:             'scenes',
  SceneId:            ':sceneId',
  PublicScene:        'scenes/:sceneId',
} as const;
```

Param tokens used by `useParams()`:

| Token | Source route(s) |
|---|---|
| `:id` | `/models-3d/:id`, `/editor/:id` |
| `:orgId` | `/org/:orgId/...` |
| `:workspaceId` | `/org/:orgId/workspace/:workspaceId/...` |
| `:sceneId` | `/user/scenes/:sceneId`, `/org/:orgId/workspace/:workspaceId/scenes/:sceneId`, `/scenes/:sceneId` |
| `:projectId` | `/org/:orgId/embed/:projectId` |
| `:modelId` | `/embed/:modelId` |

Compose paths in code from these constants — for example
`` `/${RouterPaths.Org}/${orgId}/${RouterPaths.WorkspaceSeg}/${workspaceId}/${RouterPaths.Scenes}/${sceneId}` ``.

---

## Route Tree

```
/                                                BasePage + BaseErrorBoundary
│
├── /  (index)                                   → MainPage
│
├── /auth                                        → AuthPage (lazy)
│   ├── /  (index)                               → <Navigate to="login" />
│   ├── /auth/login                              → LoginPage
│   ├── /auth/register                           → RegisterPage
│   ├── /auth/reset-password                     → ResetPasswordPage
│   └── /auth/new-password                       → NewPasswordPage
│
├── /user                                        → UserPage (lazy)
│   ├── /  (index)                               → <Navigate to="models-3d" />
│   ├── /user/models-3d                          → ModelsPage  [UserModels3D]
│   ├── /user/profile                            → ProfilePage
│   ├── /user/settings                           → SettingsPage
│   ├── /user/dev-sandbox                        → DevSandbox
│   ├── /user/scenes                             → UserScenesPage
│   └── /user/scenes/:sceneId                    → SceneEditorPage  (personal)
│
├── /models-3d                                   → Models3DPage (lazy)
│   ├── /  (index)                               → <Navigate to="/" />
│   └── /models-3d/:id                           → Model3DPage
│
├── /scenes/:sceneId                             → PublicScenePage  (public)
│
└── /org                                         (no element — children only)
    ├── /org/create                              → OrgCreatePage
    ├── /org/:orgId                              → OrgDashboardPage
    ├── /org/:orgId/workspace/:workspaceId       → WorkspaceDashboardPage
    ├── /org/:orgId/workspace/:workspaceId/scenes
    │                                            → ScenesPage
    ├── /org/:orgId/workspace/:workspaceId/scenes/:sceneId
    │                                            → SceneEditorPage  (workspace)
    └── /org/:orgId/embed/:projectId             → EmbedProjectPage

/editor                                          (top-level, no BasePage shell)
├── /  (index)                                   → <Navigate to="/" />
└── /editor/:id                                  → EditorPage  (legacy model editor)

/embed                                           (top-level, no BasePage shell)
└── /embed/:modelId                              → EmbedViewerPage  (public, API-key gated)

:code?/*                                         → ErrorPage  (catch-all)
```

---

## Full Route Table

| Path | Component | Layout | Auth | Notes |
|---|---|---|---|---|
| `/` | `MainPage` | Base | session | Marketing/landing |
| `/auth` | `AuthPage` | Base → Auth | none | Index redirects to `/auth/login` |
| `/auth/login` | `LoginPage` | Base → Auth | none | |
| `/auth/register` | `RegisterPage` | Base → Auth | none | |
| `/auth/reset-password` | `ResetPasswordPage` | Base → Auth | none | |
| `/auth/new-password` | `NewPasswordPage` | Base → Auth | none | Token-gated reset confirmation |
| `/user` | redirect | Base → User | session | Index redirects to `/user/models-3d` |
| `/user/models-3d` | `ModelsPage` (`UserModels3D`) | Base → User | session | Personal model library |
| `/user/profile` | `ProfilePage` | Base → User | session | |
| `/user/settings` | `SettingsPage` | Base → User | session | |
| `/user/dev-sandbox` | `DevSandbox` | Base → User | session | Dev-only experiments |
| `/user/scenes` | `UserScenesPage` | Base → User | session | Personal scene list |
| `/user/scenes/:sceneId` | `SceneEditorPage` | Base → User | session | Personal scene editor |
| `/models-3d` | redirect | Base → Models3D | session | Index redirects to `/` |
| `/models-3d/:id` | `Model3DPage` | Base → Models3D | session | Model detail view |
| `/scenes/:sceneId` | `PublicScenePage` | Base | none | Public scene share link |
| `/org/create` | `OrgCreatePage` | Base → Org | session | Org creation wizard |
| `/org/:orgId` | `OrgDashboardPage` | Base → Org | member | Org root dashboard |
| `/org/:orgId/workspace/:workspaceId` | `WorkspaceDashboardPage` | Base → Org | member | Workspace root |
| `/org/:orgId/workspace/:workspaceId/scenes` | `ScenesPage` | Base → Org | member | Workspace scene list |
| `/org/:orgId/workspace/:workspaceId/scenes/:sceneId` | `SceneEditorPage` | Base → Org | member | Workspace scene editor |
| `/org/:orgId/embed/:projectId` | `EmbedProjectPage` | Base → Org | member | Embed project settings |
| `/editor` | redirect | standalone | session | Index redirects to `/` |
| `/editor/:id` | `EditorPage` | standalone | session | Legacy model editor (full-viewport) |
| `/embed/:modelId` | `EmbedViewerPage` | standalone | API key | Public viewer; no session cookie |
| `/*` | `ErrorPage` | none | none | Catch-all `:code?/*` |

`Layout` column legend: **Base** = `BasePage` shell (Header, Footer, sidebar slot); **Auth/User/Models3D/Org** = nested layout under Base; **standalone** = top-level route, no Base chrome; **none** = error route renders bare.

`Auth` column: `none` = anonymous; `session` = HttpOnly JWT cookie required; `member` = session + org/workspace membership check; `API key` = embed key + domain whitelist verified server-side (see [embed.md](./embed.md)).

---

## Lazy Loading

Every non-error page is loaded on demand via React Router's `lazy` prop using the same pattern:

```ts
{
  path: RouterPaths.Login,
  lazy: async () => ({
    Component: (await import('@/pages/Auth/pages/Login')).LoginPage,
  }),
}
```

`MainPage` and `ErrorPage` are imported eagerly in `src/app/router/index.tsx` because they are the landing target and the catch-all. Everything else — including the Auth/User/Models3D/Org layout pages themselves — splits into its own chunk at build time.

---

## Layout Nesting

### `BasePage` shell

`BasePage` (`src/pages/Base/index.tsx`) is the root layout for all in-app routes. It renders the global `Header`, `UserSidebar`/footer slots, and a content `Outlet`, and is wrapped with `BaseErrorBoundary` for runtime error recovery. Nested layouts (`AuthPage`, `UserPage`, `Models3DPage`, the `/org` group) render *inside* the Base outlet.

### Standalone shells (outside Base)

Three top-level routes deliberately bypass `BasePage` so they can take the full viewport with no global chrome:

- `/editor/:id` — legacy model editor (`pages/Editor/`) renders its own Mantine `AppShell`.
- `/embed/:modelId` — `EmbedViewerPage` is a bare canvas surface for third-party iframes.
- The `:code?/*` catch-all `ErrorPage` is also top-level.

### Public surfaces

Two routes are reachable without a session cookie:

- `/scenes/:sceneId` (`PublicScenePage`) — public scene share link, sits inside the `BasePage` shell so it still has Header/Footer chrome.
- `/embed/:modelId` (`EmbedViewerPage`) — standalone, authenticated server-side via embed API key + domain whitelist (no session cookie consumed).

### Index redirects

| URL visited | Redirects to |
|---|---|
| `/auth` | `/auth/login` |
| `/user` | `/user/models-3d` |
| `/models-3d` | `/` |
| `/editor` | `/` |

---

## Editor vs Scene Editor

Two distinct editors live in this router; both share the `Model3DViewer` widget under the hood but target different domains:

- **Model editor** — `pages/Editor/`, mounted at the legacy `/editor/:id`. Edits a single 3D model's display config (materials, lighting, post-processing) and persists it to the model record. Standalone shell, full viewport.
- **Scene editor** — `pages/SceneEditor/`, mounted at both `/user/scenes/:sceneId` (personal) and `/org/:orgId/workspace/:workspaceId/scenes/:sceneId` (workspace). Edits a `scene` aggregate: multiple model references, lights, and other scene objects. Renders inside the `BasePage` shell.

When in doubt: `:id` → model editor, `:sceneId` → scene editor.

---

## Error Handling

- `BaseErrorBoundary` is set as the `ErrorBoundary` on the root route — catches React render errors within the `BasePage` tree.
- The catch-all route `':code?/*'` renders `ErrorPage`, which can receive an optional error code segment (e.g. `/not-found`, `/forbidden`, `/bad-request`, `/service-unavailable` — all defined as constants on `RouterPaths`).

---

## See also

- [scene-editor.md](./scene-editor.md) — scene editor architecture (`pages/SceneEditor/`)
- [editor.md](./editor.md) — legacy model editor (`pages/Editor/`)
- [embed.md](./embed.md) — embed projects, API-key auth, domain whitelist
- [organization-dashboard.md](./organization-dashboard.md) — org/workspace routing context
- [architecture.md](./architecture.md) — FSD layout, app shell, and import direction
