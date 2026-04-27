# Architecture

Overview of the source code structure for the MeshHub client. The project follows **Feature-Sliced Design (FSD)** — a methodology that enforces one-directional imports between clearly scoped layers.

---

## Source Tree

```
src/
├── main.tsx              # React DOM entry point
├── vite-env.d.ts         # Vite env type declarations
├── app/                  # Layer: app
│   ├── App.tsx           # Root component (Provider + PersistGate + Theme + Router)
│   ├── api/              # RTK Query base + all injected endpoint modules
│   ├── router/           # createBrowserRouter definition
│   └── store/            # configureStore (RTK Query + user slice)
├── entities/             # Layer: entities
│   ├── model-3d/         # Model entity hooks (e.g. useModel3D)
│   ├── organization/     # Organization Redux slice + selectors
│   └── user/             # User Redux slice + store selectors
├── pages/                # Layer: pages
│   ├── Auth/             # Auth layout + Login, Register, ResetPassword, NewPassword
│   ├── Base/             # Root shell layout (wraps most routes)
│   ├── Editor/           # Full-screen 3D model editor (standalone shell)
│   ├── EmbedProject/     # Embed project settings page (org dashboard sub-page)
│   ├── EmbedViewer/      # Public embed 3D viewer (API key–gated)
│   ├── Error/            # Error display page
│   ├── Main/             # Public model catalogue homepage
│   ├── Models3D/         # Model list + single model detail page
│   ├── OrgCreate/        # Create organization wizard
│   ├── OrgDashboard/     # Organization dashboard (members, workspaces, embed, settings)
│   ├── SceneEditor/      # Full-screen multi-object scene editor
│   ├── Scenes/           # Scenes list (workspace-scoped)
│   ├── User/             # User area layout + Profile, Settings, DevSandbox
│   └── UserModels3D/     # Current user's uploaded models
├── shared/               # Layer: shared
│   ├── assets/           # Static assets (images, icons)
│   ├── constants/        # App-wide constant objects
│   ├── contexts/         # React contexts (Model3DContext)
│   ├── hooks/            # Generic reusable hooks
│   ├── router/           # RouterPaths constants
│   ├── theme/            # Mantine theme override + ThemeName type
│   ├── types/            # Global TypeScript types
│   └── utils/            # Pure utility functions (date, sleep, model3d, …)
└── widgets/              # Layer: widgets
    ├── AnnotationManager/
    ├── Avatar/
    ├── BaseErrorBoundary/
    ├── ChangeAvatarModal/
    ├── ChangePasswordModal/
    ├── ColorSchemeSelect/
    ├── ColorThemeSwitcher/
    ├── EmptyData/
    ├── Errors/
    ├── Footer/
    ├── Header/
    ├── layouts/
    ├── Logo/
    ├── Model3DViewer/     # Three.js viewer widget (classes + React integration)
    ├── Models3DList/
    ├── NumberInputSlider/
    ├── OrgSwitcher/
    ├── PhoneInput/
    ├── QuotaBar/
    ├── ReviewPanel/
    ├── SessionTable/
    ├── Upload3DModelModal/
    ├── UserSidebar/
    ├── VersionHistory/
    └── WysiwygEditor/
```

---

## Layer Dependency Rules

Imports must only flow **downward** through the layer stack. Never import upward or across sibling layers at the same level.

```
┌─────────────────────────────────┐
│             app                 │  ← imports from all layers
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│           pages                 │  ← imports widgets, entities, shared
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│           widgets               │  ← imports entities, shared
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│           entities              │  ← imports shared only
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│            shared               │  ← imports nothing from above
└─────────────────────────────────┘
```

**Forbidden patterns:**
- `shared` importing from `entities`, `widgets`, or `pages`
- `entities` importing from `widgets` or `pages`
- `widgets` importing from `pages`
- Any circular dependency between features at the same layer

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| React component file | `PascalCase.tsx` | `UserSidebar.tsx` |
| React component export | Named function | `export function UserSidebar()` |
| Hook file | `camelCase.ts`, must start with `use` | `useViewer.ts` |
| Local types file | `model.ts` at feature root | `Editor/hooks/model.ts` |
| Public re-export | `index.ts` or `index.tsx` | `widgets/Avatar/index.tsx` |
| SCSS module | `ComponentName.module.scss` | `Viewer.module.scss` |
| Constant object | `PascalCase` with `UPPER_SNAKE_CASE` values | `RouterPaths.Base = '/'` |

---

## Path Alias

```ts
// vite.config.ts + tsconfig.app.json
'@' → resolve(__dirname, 'src')
```

Use `@/` for any import crossing feature boundaries. Relative `./` imports are only allowed within the same feature directory.

---

## TypeScript Configuration

The project uses **TypeScript project references**:

| File | Scope |
|---|---|
| `tsconfig.json` | Root composite config — references the two below |
| `tsconfig.app.json` | Application source (`src/`) — enables strict mode |
| `tsconfig.node.json` | Vite config (`vite.config.ts`) — Node.js types |

---

## `model.ts` Convention

Every feature that needs local TypeScript types creates a `model.ts` file at the feature root. This file is **never** re-exported from `index.ts` — it is only consumed internally within that feature.

```
pages/Editor/hooks/model.ts              ← Editor hook types
pages/Editor/components/Navbar/model.ts  ← Navbar-specific types
widgets/Model3DViewer/classes/types/     ← Viewer type layer (multiple files)
```

---

## Notable Architectural Decisions

### Vite Plugin — React Fast Refresh Scope

```ts
// vite.config.ts
react({ include: '**/Model3DViewer/classes/**/*.(ts|js)x?' })
```

The `@vitejs/plugin-react` is explicitly scoped to the `Model3DViewer/classes/` directory. This is necessary because the class-based Three.js layer does not export React components — it would otherwise be excluded from Fast Refresh transforms.

### LoaderCache — 3-Model Cap

`Loader.cache` is an `LoaderCache` instance initialized with a capacity of **3**. This is an intentional memory constraint: loaded GLTF scenes are held in memory for fast re-access, but no more than 3 models are cached at once. Older entries are evicted when capacity is exceeded. See [`3d-viewer.md`](3d-viewer.md) for the full `Loader` API.

### Editor as Standalone Shell

`EditorPage` is mounted **outside** the `BasePage` layout shell (it has its own router entry at `/editor/:id`). It uses its own Mantine `AppShell` with custom header, footer, and navbar dimensions. See [`editor.md`](editor.md) for full internals.

### Cookie-Based Auth Sessions

The app uses HTTP-only cookies for session management (`credentials: 'include'` on all requests). The session ID is also stored in Redux as `user.session` (persisted to `localStorage`) for UI-level auth checks, but the actual auth token lives in the cookie.

