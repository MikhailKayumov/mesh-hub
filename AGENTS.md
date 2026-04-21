# AGENTS.md — MeshHub (Root)

This file is the top-level LLM agent guide for the **MeshHub** monorepo. Read this before making any change. For deeper per-subsystem details, refer to the section-specific AGENTS files listed below.

---

## Sub-system AGENTS Files

| File | Scope |
|---|---|
| [`server/AGENTS.md`](server/AGENTS.md) | NestJS REST API — modules, patterns, conventions |
| [`client/AGENTS.md`](client/AGENTS.md) | React SPA — FSD layers, RTK Query, Three.js viewer |

Always read the relevant sub-system AGENTS file before touching code in that workspace.

---

## Monorepo Layout

```
mesh-hub/
├── client/               # React 19 SPA — Feature-Sliced Design
│   ├── src/
│   │   ├── app/          # Bootstrap, store, RTK Query base, router
│   │   ├── entities/     # Domain hooks + Redux slices (user, model-3d)
│   │   ├── pages/        # Route-level components (lazy loaded)
│   │   ├── shared/       # Cross-cutting utilities, theme, constants
│   │   └── widgets/      # Composite reusable UI blocks (19 widgets)
│   ├── nginx/            # Nginx config for the production container
│   ├── Dockerfile        # Multi-stage: Node build → Nginx serve
│   └── AGENTS.md
│
├── server/               # NestJS 11 REST API
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── app.bootstrap.ts
│   │   ├── main.ts
│   │   ├── modules/      # Feature modules (auth, user, models-3d, …)
│   │   ├── database/     # Entities, migrations, seeds, init scripts
│   │   ├── guards/       # JwtAuthGuard, ThrottlerBehindProxyGuard
│   │   ├── interceptors/ # CookiesInterceptor, LoggingInterceptor
│   │   ├── decorators/   # @Public, @Refresh, @Roles, @User, @OptionalUser, …
│   │   ├── pipes/        # File size/type/extension validators
│   │   ├── exceptions/   # AppHttpException
│   │   └── constants/    # Roles, file limits, regexp, error messages
│   ├── Dockerfile        # Multi-stage: Node build → Node run
│   └── AGENTS.md
│
├── codegen/              # swagger-typescript-api scripts
│   └── package.json
│
├── data/                 # Runtime volumes (gitignored)
│   ├── db/               # PostgreSQL data
│   └── files/            # Uploaded files (production mount)
│
├── docker-compose.yml        # Production — 3 services: db, api, client
├── docker-compose.dev.yml    # Development — db + api; client runs locally
└── README.md
```

---

## Technology Map

### Backend

| Concern | Solution |
|---|---|
| Framework | NestJS 11 on Express |
| Language | TypeScript 6 |
| ORM | TypeORM 0.3 (4 schemas, snake_case naming strategy) |
| Database | PostgreSQL 18 |
| Auth | JWT HS512, HttpOnly cookie, DB-persisted sessions |
| Password hash | PBKDF2, sha512, 64-byte output, per-user salt |
| File upload | Multer (multipart), stored on local filesystem |
| Email | `@nestjs-modules/mailer` + Nodemailer (Yandex SMTP) |
| Queue | Bull (Redis) via `@nestjs/bull` |
| Rate limiting | `@nestjs/throttler` (real IP via X-Forwarded-For) |
| Logging | Winston (console + optional file transport) |
| Validation | `class-validator` + `class-transformer`, global `ValidationPipe` |
| API docs | `@nestjs/swagger`, exported to `swagger.openapi3.json` |

### Frontend

| Concern | Solution |
|---|---|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build | Vite 8 |
| Component library | Mantine 9 |
| State | Redux Toolkit + RTK Query + redux-persist |
| Routing | React Router DOM 7 |
| 3D rendering | Three.js 0.184 + camera-controls 3 |
| Rich text | Tiptap 3 + @mantine/tiptap 9 |
| Forms | Zod 4 + Mantine forms |
| Styling | SCSS modules (sass-embedded) + Mantine CSS |
| Icons | @tabler/icons-react |

---

## Architecture Principles

### Backend Patterns

| Pattern | Description |
|---|---|
| **Repository** | Each entity has a dedicated repository class; services never query `EntityManager` directly |
| **Mapper** | Dedicated mapper class converts entity ↔ DTO; mappers are not NestJS providers |
| **Strategy (file storage)** | `FileStorageService` delegates to `IFileStorageStrategy`; swap backend (e.g. S3) by replacing the strategy provider |
| **Pagination** | All list endpoints use `PaginationDto` (skip/size/sort) and return `PaginationResponseDto<T>` |
| **Error handling** | Throw `AppHttpException` for app errors; ValidationPipe wraps class-validator errors into the same shape |
| **Global providers** | Throttler guard → JWT auth guard → Cookies interceptor applied to every request |

### Frontend Patterns

| Pattern | Description |
|---|---|
| **Feature-Sliced Design** | Strict one-directional imports: `app → pages → widgets → entities → shared` |
| **RTK Query** | Single `createApi` instance (`Api`); all endpoint modules use `injectEndpoints` with `overrideExisting: true` |
| **Auth token refresh** | Mutex-locked auto-refresh in `baseQuery` before retrying failed requests |
| **Viewer class stack** | Three.js logic lives in plain TypeScript classes (`Viewer`, `CameraController`, `Renderer`, `World`); React integration via a single `useViewer` hook |
| **SCSS injection** | `_mantine.scss` is globally injected via `vite.config.ts` `additionalData`; never `@use` it manually |

---

## Naming Conventions

### Backend

| Artifact | Convention | Example |
|---|---|---|
| Module folder | `kebab-case` | `models-3d/` |
| Entity file | `kebab-case.entity.ts` | `model-3d-file.entity.ts` |
| Entity class | `PascalCase` + `Entity` suffix | `Model3dFileEntity` |
| DTO file | `kebab-case.[qualifier].dto.ts` | `model-3d.update.request.dto.ts` |
| DTO class | `PascalCase` | `Model3dUpdateRequestDto` |
| Repository | `[name].repository.ts` | `model-3d.repository.ts` |
| Mapper | `[name].mapper.ts` | `model-3d.mapper.ts` |
| Migration | `{timestamp}-{PascalCaseName}.ts` | `1703017999243-Init.ts` |
| DB schema | `snake_case` | `model_3d` |
| DB table | `snake_case` | `model_3d_file` |
| DB column | `snake_case` | `user_meta_id` |
| Path alias | `@/` → `src/` | `import { X } from '@/modules/...'` |

### Frontend

| Artifact | Convention | Example |
|---|---|---|
| React component | `PascalCase` file + named export | `UserSidebar.tsx` → `export function UserSidebar()` |
| Hook | `camelCase`, starts with `use` | `useViewer.ts` |
| SCSS module | `ComponentName.module.scss` | `Viewer.module.scss` |
| Local types | `model.ts` per feature, never re-exported | `pages/Editor/hooks/model.ts` |
| Constants | `UPPER_SNAKE_CASE` values, `PascalCase` object | `RouterPaths.Base = '/'` |
| Path alias | `@/` → `src/` | `import { X } from '@/shared/...'` |
| Public re-export | `index.ts` / `index.tsx` at directory root | `widgets/Avatar/index.tsx` |

---

## Authentication Flow (end-to-end)

```
Browser                 Nginx (prod)       NestJS API              PostgreSQL
  │                         │                  │                       │
  ├─ POST /api/auth/login ──►│──────────────────►│                       │
  │                         │                  │─ validate credentials ─►│
  │                         │                  │◄─ user row ────────────│
  │                         │                  │─ create SessionEntity ──►│
  │                         │                  │─ sign JWT (HS512) ──────│
  │◄── 200 OK + Set-Cookie ─│◄─────────────────│                       │
  │    (x-access-token)     │                  │
  │                         │                  │
  ├─ GET /api/user/current ─►│──────────────────►│
  │   cookie: x-access-token│                  │─ JwtAuthGuard:         │
  │                         │                  │  verify JWT signature  │
  │                         │                  │  load session from DB ─►│
  │                         │                  │  attach to req.session │
  │◄── 200 OK (user object) ─│◄────────────────│                       │
  │                         │                  │
  ├─ POST /api/auth/refresh ─►│──────────────────►│  (@Refresh guard)     │
  │   cookie: refresh token │                  │─ verify refresh JWT    │
  │                         │                  │─ update session tokens─►│
  │◄── 200 OK + new cookies ─│◄────────────────│                       │
```

- Tokens are **never sent in headers** — only via HttpOnly cookies.
- The frontend uses `async-mutex` to prevent concurrent refresh race conditions.

---

## Database Schemas & Key Entities

```
PostgreSQL "meshhub"

auth.session            — active JWT sessions (IP, user agent, tokens, expiry)

users.user              — accounts (email, password hash+salt, flags, last login)
users.user_meta         — profile extras (avatar filename, bio, favorite CG soft)
users.role              — [user, admin, super-user]
users.user_role         — M:M join
users.user_reset_password — password reset tokens

resources.cg_soft       — CG software reference (Blender, Maya, etc.)
resources.category      — model categories

model_3d.model_3d       — model record (title, description, visibility, owner)
model_3d.model_3d_file  — uploaded file metadata (filename, size, MIME)
model_3d.model_3d_categories — M:M join with categories
```

**Base classes** (`src/database/entities/base.ts`):
- `GuidIdEntityBase` — UUID PK + `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- `IntIdBaseEntity` — Serial int PK + same timestamps

Schema and table name constants are in `src/database/constants.ts`. Always reference these in `@Entity()` decorators.

---

## File Storage Layout

```
server/files/          (dev)   |   ./data/files/   (Docker production volume)
├── avatars/
│   └── <userId>.<ext>                 # overwritten on avatar update
└── models-3d/
    ├── temp/                          # multer upload target; cleaned after move
    └── <modelId>/
        ├── <filename>.glb/.gltf       # the 3D model file
        └── thumbnail.png              # optional screenshot (always PNG)
```

Limits:

| Type | Max size | Allowed formats |
|---|---|---|
| Avatar | 1 MB | PNG, JPEG, GIF, SVG, WebP, AVIF |
| 3D model | 3 GB | `.glb`, `.gltf` |
| Thumbnail | — | PNG (base64 input converted server-side) |

---

## REST API Surface

Global prefix: `/api` (configurable via `APP_GLOBAL_PREFIX`).

| Module | Controller prefix | Notes |
|---|---|---|
| Auth | `/auth` | signup, login, logout, refresh, session management |
| User | `/user` | profile CRUD, avatar upload, password change/reset |
| 3D Models | `/models-3d` | model CRUD, file upload, thumbnail |
| Resources | `/resources` | categories + CG software reference lists |
| Files (static) | `/user/avatar`, `/models-3d/files` | direct file serving |

Default auth: **all endpoints are authenticated** via `JwtAuthGuard` (global).
Use `@Public()` to opt out. Use `@Roles(UserRoles.Admin)` to require a role.

Swagger UI: `/swagger`
OpenAPI JSON: `server/swagger.openapi3.json`

---

## Frontend State Shape

```ts
Redux store:
{
  '@mesh_hub/api': RtkQueryState,   // RTK Query cache
  user: {
    session: string | null,          // session ID from last successful auth
    theme: ThemeName,                // persisted color theme
  }
}
```

`user` slice is persisted to `localStorage` under key `@mesh_hub/user`.

Available themes: `'deepblue' | 'bluegray' | 'darkpink' | 'skyblue' | 'green' | 'deeporange' | 'magenta'`

---

## RTK Query Cache Tags

```ts
ApiTags = {
  Reset:               'Reset',
  CurrentUser:         'CurrentUser',
  CGSoft:              'CGSoft',
  Categories:          'Categories',
  Get3DModels:         'Get3DModels',
  Get3DModel:          'Get3DModels',        // ⚠ same value — intentional
  CurrentUser3DModels: 'CurrentUser3DModels',
  CurrentUser3DModel:  'CurrentUser3DModel',
}
```

Invalidating `Reset` forces both `currentUser` and `model3D` queries to refetch — use only for hard resets (e.g. all-sessions logout).

---

## Docker Compose Files

### `docker-compose.dev.yml` (development)

| Service | Image | Purpose |
|---|---|---|
| `db` | `postgres:18.0` | Database; reads `server/.env`; data in `./data/db` |

The API and client are expected to run locally with `npm run start:dev` and `npm run dev`.

### `docker-compose.yml` (production)

| Service | Image | Ports | Purpose |
|---|---|---|---|
| `db` | `postgres:alpine` | 5432 | Database; data in `./data/db`; reads `server/.env.deploy` |
| `api` | Built from `server/Dockerfile` | 8088→8080 | NestJS API; files in `./data/files`; logs in `./data/.log` |
| `client` | Built from `client/Dockerfile` | 80→80 | Nginx SPA; proxies `/api/*` and `/swagger/*` to `api:8080` |

Networks: `net-db` (db ↔ api), `net-api` (api ↔ client).

---

## How to Add a New Backend Feature

1. Create `src/modules/<name>/` with module, controller, service, repository, mapper, DTOs.
2. Add entity in `src/database/entities/<schema>/<name>.entity.ts`; extend `GuidIdEntityBase` or `IntIdBaseEntity`.
3. Add table/schema constants to `src/database/constants.ts`.
4. Import `TypeOrmModule.forFeature([EntityClass])` in the feature module.
5. Generate migration: `npm run migration:generate -- --schema=<schema> --name=<Name>` (Windows: `migration:generate:win`).
6. Import the feature module in `src/app.module.ts`.

→ Detailed guide: [`server/AGENTS.md`](server/AGENTS.md#how-to-add-a-new-feature-module)

---

## How to Add a New Frontend Widget

1. Create `src/widgets/<WidgetName>/` with `index.tsx` and `WidgetName.tsx`.
2. Add SCSS module as `WidgetName.module.scss` if needed.
3. Only import from `entities/` and `shared/` — never from `pages/`.
4. Re-export the public API from `index.tsx`.

→ Detailed guide: [`client/AGENTS.md`](client/AGENTS.md)

---

## How to Add a New API Endpoint (end-to-end)

### Backend
1. Add controller method with HTTP decorator and auth decorators (`@Public()`, `@Roles(...)`, `@User()`).
2. Add the service method and repository query.
3. Add input DTO with `class-validator` decorators.

### Frontend
1. Add the endpoint to the appropriate `Api.injectEndpoints` call.
2. Set `overrideExisting: true`.
3. Export the generated hook.
4. Invalidate or provide cache tags as needed.

---

## Code Generation (swagger → TypeScript types)

```bash
# Step 1: export OpenAPI spec from the server
cd server
npm run swagger:generate   # → server/swagger.openapi3.json

# Step 2: generate DTO types for the client
cd ../codegen
npm install
npm run generate-client-types:no-client
# → client/src/app/api/new_dto.ts
```

---

## Key Constraints

- **Never use `process.env` directly in feature code** — use `ConfigService` on the backend.
- **Never create a second `createApi` instance** on the frontend — use `Api.injectEndpoints`.
- **Never import upward** in FSD layers (e.g., `shared` must not import from `widgets`).
- **Never send JWT in Authorization header** — the API reads tokens exclusively from HttpOnly cookies.
- **`synchronize: false`** — database schema is managed only via TypeORM migrations, never via auto-sync.
- **Soft-delete** — all entities extending the base classes include a `deletedAt` column; use TypeORM's soft-delete methods, not hard deletes, unless the operation explicitly requires removal.
