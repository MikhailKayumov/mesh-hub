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
- **Backend:** NestJS REST API at `../server/` (modules: `auth`, `user`, `models-3d`, `resources`, `files`, `notifications`)

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

---

## Cache Tags (`ApiTags`)

```ts
// src/app/api/tags.ts
export const ApiTags = {
  Reset:               'Reset',               // global invalidation sentinel
  CurrentUser:         'CurrentUser',
  CGSoft:              'CGSoft',
  Categories:          'Categories',
  Get3DModels:         'Get3DModels',
  Get3DModel:          'Get3DModels',         // ⚠ same value as Get3DModels (intentional)
  CurrentUser3DModels: 'CurrentUser3DModels',
  CurrentUser3DModel:  'CurrentUser3DModel',
}
```

**Invalidation map:**

| Action | Invalidates |
|---|---|
| `register` / `login` / `logout` | `CurrentUser`, `Get3DModel` |
| `closeCurrentUserSessions` | `CurrentUser`, `Get3DModel` |
| `updateCurrentUser` | `CurrentUser`, `CGSoft` |
| `updateCurrentUserAvatar` | `CurrentUser` |
| `updateModel3D` | `Reset`, `Get3DModels`, `Get3DModel:{id}` |
| `upload3DModel` / `delete3DModel` / `saveThumbnail` | `CurrentUser3DModels`, `Get3DModels` |

`Reset` tag is provided by `currentUser` and `model3D` queries. Invalidating it forces both to refetch — use it only for hard resets (e.g. after all-sessions logout).

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
  }
}
```

- Persist key: `@mesh_hub/user` → `localStorage`
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

## Key File Locations

| Concern | Path |
|---|---|
| App root component | `src/app/App.tsx` |
| Router definition | `src/app/router/index.tsx` |
| Redux store | `src/app/store/index.ts` |
| RTK Query base | `src/app/api/base.ts` |
| API URL constants | `src/app/api/urls.ts` |
| Route path constants | `src/shared/router/paths.ts` |
| User Redux slice | `src/entities/user/store/reducer.ts` |
| Theme definition | `src/shared/theme/` |
| 3D Viewer entry | `src/widgets/Model3DViewer/index.tsx` |
| Viewer orchestrator class | `src/widgets/Model3DViewer/classes/Viewer/Viewer.ts` |
| Editor page | `src/pages/Editor/index.tsx` |

