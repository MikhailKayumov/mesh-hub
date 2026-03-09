# Routing

All routes are defined in `src/app/router/index.tsx` using React Router DOM v7's `createBrowserRouter`. Route path constants live in `src/shared/router/paths.ts` as the `RouterPaths` object.

---

## Route Path Constants

```ts
// src/shared/router/paths.ts
export const RouterPaths = {
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

  // editor
  Editor:             'editor',
} as const;
```

---

## Route Tree

```
/                           BasePage + BaseErrorBoundary
│
├── /  (index)              → MainPage
│
├── /auth                   → AuthPage (lazy)
│   ├── /  (index)          → <Navigate to="login" />
│   ├── /login              → LoginPage (lazy)
│   ├── /register           → RegisterPage (lazy)
│   ├── /reset-password     → ResetPasswordPage (lazy)
│   └── /new-password       → NewPasswordPage (lazy)
│
├── /user                   → UserPage (lazy)
│   ├── /  (index)          → <Navigate to="models-3d" />
│   ├── /models-3d          → ModelsPage (lazy)   [UserModels3D]
│   ├── /profile            → ProfilePage (lazy)
│   ├── /settings           → SettingsPage (lazy)
│   └── /dev-sandbox        → DevSandbox (lazy)
│
├── /models-3d              → Models3DPage (lazy)
│   ├── /  (index)          → <Navigate to="/" />
│   └── /:id                → Model3DPage (lazy)
│
/editor                     (NO BasePage shell)
├── /  (index)              → <Navigate to="/" />
└── /:id                    → EditorPage (lazy)

:code?/*                    → ErrorPage  (catch-all)
```

---

## Full Route Table

| URL | Component | Layout Shell | Lazy |
|---|---|---|---|
| `/` | `MainPage` | `BasePage` | No |
| `/auth` | `AuthPage` | `BasePage` | Yes |
| `/auth/login` | `LoginPage` | `BasePage` → `AuthPage` | Yes |
| `/auth/register` | `RegisterPage` | `BasePage` → `AuthPage` | Yes |
| `/auth/reset-password` | `ResetPasswordPage` | `BasePage` → `AuthPage` | Yes |
| `/auth/new-password` | `NewPasswordPage` | `BasePage` → `AuthPage` | Yes |
| `/user` | redirect → `/user/models-3d` | `BasePage` | — |
| `/user/models-3d` | `ModelsPage` (UserModels3D) | `BasePage` → `UserPage` | Yes |
| `/user/profile` | `ProfilePage` | `BasePage` → `UserPage` | Yes |
| `/user/settings` | `SettingsPage` | `BasePage` → `UserPage` | Yes |
| `/user/dev-sandbox` | `DevSandbox` | `BasePage` → `UserPage` | Yes |
| `/models-3d` | redirect → `/` | `BasePage` → `Models3DPage` | — |
| `/models-3d/:id` | `Model3DPage` | `BasePage` → `Models3DPage` | Yes |
| `/editor` | redirect → `/` | — (no shell) | — |
| `/editor/:id` | `EditorPage` | — (no shell) | Yes |
| `/*` | `ErrorPage` | — | No |

---

## Lazy Loading

All pages except `MainPage` and `ErrorPage` are loaded on demand using the React Router `lazy` prop:

```ts
{
  path: RouterPaths.Login,
  lazy: async () => ({
    Component: (await import('@/pages/Auth/pages/Login')).LoginPage,
  }),
}
```

This splits each page into a separate chunk at build time, reducing the initial bundle size.

---

## Layout Nesting

### `BasePage` Shell

`BasePage` (`src/pages/Base/index.tsx`) is the root layout for all public-facing routes. It renders the global `Header`, `Footer`, and a content outlet. It is wrapped with `BaseErrorBoundary` for runtime error recovery.

### `EditorPage` — Standalone Shell

`EditorPage` sits at the top level of the router, completely outside `BasePage`. It renders its own Mantine `AppShell` with a dedicated header, navbar, footer, and main area. This allows the editor to take the full viewport without inheriting any global layout chrome.

### Index Redirects

Several parent routes redirect to a sensible child on direct access:

| URL visited | Redirects to |
|---|---|
| `/auth` | `/auth/login` |
| `/user` | `/user/models-3d` |
| `/models-3d` | `/` |
| `/editor` | `/` |

---

## Error Handling

- `BaseErrorBoundary` is set as the `ErrorBoundary` on the root route — catches React render errors within the `BasePage` tree.
- The catch-all route `':code?/*'` renders `ErrorPage`, which can receive an optional error code segment (e.g. `/not-found`, `/forbidden`).

