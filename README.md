# MeshHub

A full-stack web platform for uploading, browsing, and interactively viewing 3D models (`.glb` / GLTF format) in the browser.

Custom Copilot agents for this repository are listed in [.github/agents/README.md](.github/agents/README.md).
Custom Copilot instructions are defined in [.github/copilot-instructions.md](.github/copilot-instructions.md) and [.github/instructions](.github/instructions).
Custom Copilot skills are indexed in [.github/skills/README.md](.github/skills/README.md).

---

## Repository Structure

```
mesh-hub/
├── client/               # React SPA (Vite + Mantine + Three.js)
├── server/               # NestJS REST API
├── data/                 # Persistent data volumes (gitignored)
│   ├── db/               # PostgreSQL data directory
│   └── files/            # Uploaded files (production volume)
├── docker-compose.yml        # Production compose file
├── docker-compose.dev.yml    # Development compose file
└── README.md             # This file
```

---

## Tech Stack

### Backend (`server/`)

| Layer | Technology | Version |
|---|---|---|
| Framework | NestJS (Express) | 11 |
| Language | TypeScript | 6 |
| Database | PostgreSQL via TypeORM | 18 / 0.3 |
| Auth | JWT HS512 + DB sessions, HttpOnly cookie | — |
| File storage | Local filesystem (pluggable strategy) | — |
| Email | Nodemailer / Yandex SMTP | — |
| Queue | Bull (Redis) | — |
| API docs | Swagger / OpenAPI 3 at `/swagger` | — |
| Runtime | Node.js | ≥ 24.11.1 |

### Frontend (`client/`)

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.2.5 |
| Language | TypeScript | 6 |
| Build Tool | Vite | 8 |
| Component Library | Mantine | 9.1.0 |
| State Management | Redux Toolkit + RTK Query + redux-persist | 2.11.2 |
| Routing | React Router DOM | 7 |
| 3D Rendering | Three.js + camera-controls | 0.184.0 |
| Rich Text | Tiptap + @mantine/tiptap | 3.22.4 |
| Form Validation | Zod | 4 |
| Styling | SCSS (sass-embedded) + Mantine CSS | — |

---

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | **≥ 24.11.1** |
| npm | **≥ 11.6.2** |
| Docker | any recent version (for containerized setup) |
| PostgreSQL | 18 (or use Docker) |

---

## Default Ports

| Service | Port |
|---|---|
| Client (dev) | **8000** |
| API | **8080** |
| PostgreSQL | **5432** (dev) / **8888** (local default) |

---

## Quick Start — Docker (Recommended)

### Development

```bash
# 1. Copy and fill in server environment variables
cp server/.env.example server/.env
# Edit server/.env — set POSTGRES_*, AUTH_JWT_*, SMTP_*, etc.

# 2. Start database + API
docker compose -f docker-compose.dev.yml up --build
```

| Service | URL |
|---|---|
| API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/swagger |
| PostgreSQL | localhost:5432 |

Then start the client locally (see [Local Setup](#quick-start--local-without-docker)).

### Production

```bash
# 1. Copy and fill production env file
cp server/.env.example server/.env.deploy
# Edit server/.env.deploy with production credentials

# 2. Build and start all services
docker compose up --build -d
```

| Service | URL |
|---|---|
| Client (Nginx) | http://localhost:80 |
| API (proxied) | http://localhost/api |
| Swagger UI (proxied) | http://localhost/swagger |

> In production the Nginx container serves the built SPA and proxies `/api/*` and `/swagger/*` to the `api` container. Files are stored in `./data/files/` on the host.

---

## Quick Start — Local (without Docker)

### 1. Configure and start the server

```bash
cd server
cp .env.example .env
# Edit .env — at minimum set POSTGRES_* and AUTH_JWT_* vars
npm install
npm run db:init    # Creates schemas and runs all TypeORM migrations
npm run db:seeds   # Seeds roles and reference data
npm run start:dev  # Watch mode
```

API: `http://localhost:8080/api`
Swagger: `http://localhost:8080/swagger`

### 2. Configure and start the client

```bash
cd client
# Create .env (optional — defaults work against http://localhost:8080)
npm install
npm run dev
```

Client: `http://localhost:8000`

---

## Environment Variables

### Server (`server/.env`)

#### Application

| Variable | Default | Description |
|---|---|---|
| `APP_MODE` | `DEVELOPMENT` | `DEVELOPMENT` \| `PRODUCTION` \| `TEST` |
| `APP_HOST` | `localhost` | Bind host |
| `APP_PORT` | `8080` | Listen port |
| `APP_GLOBAL_PREFIX` | `api` | URL prefix for all routes |
| `APP_FRONTEND_URL` | `http://localhost:8000` | Frontend URL (used in email links) |

#### Database

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `8888` | PostgreSQL port |
| `POSTGRES_USER` | `SuperMesh` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `pass4mesh` | PostgreSQL password |
| `POSTGRES_DB` | `meshhub` | Database name |

#### Authentication & JWT

| Variable | Default | Description |
|---|---|---|
| `AUTH_JWT_COOKIE_NAME` | `x-access-token` | HttpOnly cookie name |
| `AUTH_JWT_ACCESS_SECRET` | — | HS512 signing secret for access tokens |
| `AUTH_JWT_REFRESH_SECRET` | — | HS512 signing secret for refresh tokens |
| `AUTH_JWT_ACCESS_EXPIRES` | `1800` | Access token TTL (seconds) |
| `AUTH_JWT_REFRESH_EXPIRES` | `432000` | Refresh token TTL (seconds) |
| `RESET_PASSWORD_EXPIRE_SECONDS` | `1800` | Password reset token TTL |

#### Logging

| Variable | Default | Description |
|---|---|---|
| `LOGS_LEVEL` | `silly` | Winston log level |
| `LOGS_TO_FILE_ENABLED` | `false` | Also write logs to file |

#### CORS & Rate Limiting

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS_WHITE_LIST` | `*` | Comma-separated allowed origins |
| `THROTTLE_GLOBAL_TTL` | `5` | Rate limit window (seconds) |
| `THROTTLE_GLOBAL_LIMIT` | `30` | Max requests per IP per window |

#### Swagger

| Variable | Default | Description |
|---|---|---|
| `SWAGGER_SERVER` | `http://localhost:8080` | Base server URL in Swagger UI |
| `SWAGGER_TITLE` | `MeshHub Swagger` | Document title |
| `SWAGGER_VERSION` | `1.0` | API version |

Full variable reference: [`server/docs/configuration.md`](server/docs/configuration.md)

### Client (`client/.env`)

| Variable | Used By | Description |
|---|---|---|
| `PORT` | `vite.config.ts` | Dev server port (default: `8000`) |
| `API_PROXY_URL` | `vite.config.ts` | NestJS API base URL for dev proxy |
| `WS_PROXY` | `vite.config.ts` | WebSocket URL for dev proxy |
| `VITE_APP_API_URL` | browser bundle | API base URL injected into RTK Query |

---

## API Overview

All REST endpoints are prefixed with `/api`. Full reference: [`server/docs/api.md`](server/docs/api.md).

| Group | Prefix | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | `POST signup`, `POST login`, `POST logout`, `POST refresh`, session CRUD |
| User | `/api/user` | `GET/PATCH current`, avatar upload, password change, password reset |
| 3D Models | `/api/models-3d` | CRUD, file upload, thumbnail save |
| Resources | `/api/resources` | Categories list, CG software list |
| Files | `/api/user/avatar/:fileName`, `/api/models-3d/files/:modelId/:fileName` | Static file serving |

Authentication is cookie-based (HttpOnly JWT). Swagger UI with full schema is available at `/swagger`.

---

## Database Schema

PostgreSQL database `meshhub` uses four schemas:

```
auth
└── session

users
├── user
├── user_meta
├── role
├── user_role          (M:M join)
└── user_reset_password

resources
├── cg_soft
└── category

model_3d
├── model_3d
├── model_3d_file
└── model_3d_categories  (M:M join)
```

TypeORM migrations live in `server/src/database/migrations/`.
Full entity reference: [`server/docs/database.md`](server/docs/database.md)

---

## File Storage

Uploaded files are stored under `server/files/` (mounted as `./data/files/` in Docker):

| Type | Path | Size Limit | Formats |
|---|---|---|---|
| Avatars | `files/avatars/<userId>.<ext>` | 1 MB | PNG, JPEG, GIF, SVG, WebP, AVIF |
| 3D Models | `files/models-3d/<modelId>/<filename>` | 3 GB | `.glb`, `.gltf` |
| Thumbnails | `files/models-3d/<modelId>/thumbnail.png` | — | PNG |

---

## Frontend Architecture

The client follows **Feature-Sliced Design (FSD)** with strict one-directional imports:

```
app  ←  pages  ←  widgets  ←  entities  ←  shared
```

| Layer | Path | Description |
|---|---|---|
| `app` | `client/src/app/` | Root component, Redux store, RTK Query base, router |
| `pages` | `client/src/pages/` | Route-level components (lazy loaded) |
| `widgets` | `client/src/widgets/` | Composite reusable UI blocks |
| `entities` | `client/src/entities/` | Domain model hooks and Redux slices |
| `shared` | `client/src/shared/` | Utilities, theme, constants, hooks |

Full architecture reference: [`client/docs/architecture.md`](client/docs/architecture.md)

### Route Table (summary)

| URL | Page |
|---|---|
| `/` | Main — public model catalogue |
| `/auth/login` | Login |
| `/auth/register` | Registration |
| `/auth/reset-password` | Password reset request |
| `/auth/new-password` | Set new password |
| `/models-3d/:id` | Single model detail + 3D viewer |
| `/editor/:id` | Full-screen 3D editor |
| `/user/models-3d` | Current user's uploads |
| `/user/profile` | User profile |
| `/user/settings` | Account settings |

### 3D Viewer

The `Model3DViewer` widget (`client/src/widgets/Model3DViewer/`) renders `.glb` / GLTF files using a custom Three.js class stack:

```
Viewer (orchestrator)
├── CameraController  — PerspectiveCamera + camera-controls
├── Renderer          — WebGLRenderer + ResizeObserver + animation clock
└── World             — Scene + lights + GLTF loader with LRU cache (3 entries)
```

Full viewer reference: [`client/docs/3d-viewer.md`](client/docs/3d-viewer.md)

---

## DTO Types

Client-side DTO types live in `client/src/app/api/dto.ts` and are maintained manually.
When the server API changes, update `dto.ts` by hand to reflect the new response/request shapes.

To export the current OpenAPI spec from the server (for reference):

```bash
cd server && npm run swagger:generate  # → server/swagger.openapi3.json
```

---

## Scripts Reference

### Server (`cd server`)

| Script | Description |
|---|---|
| `npm run start:dev` | Start with file watcher (development) |
| `npm run start:prod` | Start compiled JS from `dist/` |
| `npm run build` | Compile TypeScript |
| `npm run db:init` | Create schemas + run all migrations |
| `npm run db:init:hard` | Drop schemas, re-init, run migrations |
| `npm run db:seeds` | Run database seeds |
| `npm run db:build` | `db:init` + `db:seeds` |
| `npm run db:build:hard` | `db:init:hard` + `db:seeds` |
| `npm run migration:generate` | Generate migration (`--schema=` `--name=`) |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run swagger:generate` | Build + export `swagger.openapi3.json` |
| `npm run lint` | Lint source files |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |

### Client (`cd client`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 8000) |
| `npm run build` | Type-check + build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier over `src/` |
| `npm run tscheck` | TypeScript type-check without emit |

---

## Documentation

### Server

| File | Contents |
|---|---|
| [`server/docs/architecture.md`](server/docs/architecture.md) | Module structure, design patterns, request lifecycle |
| [`server/docs/api.md`](server/docs/api.md) | Full REST endpoint reference |
| [`server/docs/auth.md`](server/docs/auth.md) | Auth flow, JWT, sessions, RBAC |
| [`server/docs/database.md`](server/docs/database.md) | Entities, schema layout, migrations |
| [`server/docs/configuration.md`](server/docs/configuration.md) | All environment variables |
| [`server/docs/file-storage.md`](server/docs/file-storage.md) | File storage strategy and directory layout |
| [`server/docs/modules.md`](server/docs/modules.md) | Per-module controller/service/DTO reference |
| [`server/AGENTS.md`](server/AGENTS.md) | LLM agent guide for the backend |

### Client

| File | Contents |
|---|---|
| [`client/docs/architecture.md`](client/docs/architecture.md) | FSD layer breakdown and conventions |
| [`client/docs/routing.md`](client/docs/routing.md) | Route table and lazy loading |
| [`client/docs/state-management.md`](client/docs/state-management.md) | Redux store and RTK Query |
| [`client/docs/api.md`](client/docs/api.md) | API endpoints, DTOs, cache tags |
| [`client/docs/theming.md`](client/docs/theming.md) | Color themes and Mantine overrides |
| [`client/docs/widgets.md`](client/docs/widgets.md) | Widget catalogue |
| [`client/docs/3d-viewer.md`](client/docs/3d-viewer.md) | Model3DViewer architecture and API |
| [`client/docs/editor.md`](client/docs/editor.md) | EditorPage internals |
| [`client/AGENTS.md`](client/AGENTS.md) | LLM agent guide for the frontend |

---

## License

UNLICENSED — private project.
Author: Mikhail Kayumov &lt;mkmind@yandex.ru&gt;
