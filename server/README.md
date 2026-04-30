# MeshHub — Server

NestJS REST API backend for the MeshHub 3D model sharing platform. Provides authentication, user management, organizations and workspaces, 3D model storage with versioning/comments/annotations, scene editing, public embed projects with API-key access, in-app notifications, and reference data.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Express) |
| Language | TypeScript 6 |
| Database | PostgreSQL 18 via TypeORM 0.3 |
| Auth | JWT (HS512) + DB sessions, cookie transport |
| File storage | Pluggable strategy — local filesystem (default) or S3 per organization (AES-256-CBC encrypted config) |
| Email | Nodemailer / Yandex SMTP |
| Queue | Bull (Redis) for webhook delivery |
| Docs | Swagger / OpenAPI 3 at `/swagger` |
| Runtime | Node.js ≥ 24.11.1 |

## Documentation

| File | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Module structure, design patterns, request lifecycle |
| [docs/api.md](docs/api.md) | Full REST endpoint reference |
| [docs/auth.md](docs/auth.md) | Auth flow, JWT, sessions, RBAC, decorators |
| [docs/database.md](docs/database.md) | Entities, schemas, migrations, seeds |
| [docs/configuration.md](docs/configuration.md) | All environment variables |
| [docs/file-storage.md](docs/file-storage.md) | File storage strategy, directory layout, limits |
| [docs/modules.md](docs/modules.md) | Per-module controller/service/DTO reference |
| [docs/organizations.md](docs/organizations.md) | Organizations, workspaces, members, API keys, webhooks, subscriptions |
| [docs/scenes.md](docs/scenes.md) | Scene editor backend — scenes, scene models, scene lights |
| [docs/embed.md](docs/embed.md) | Embed projects — public viewer endpoints and API-key access |
| [docs/model-3d.md](docs/model-3d.md) | 3D model module — versioning, comments, annotations, display config |
| [docs/notifications.md](docs/notifications.md) | In-app notifications — events, delivery, read state |
| [AGENTS.md](AGENTS.md) | LLM-friendly conventions and how-to guides |

## Quick Start (local)

### Prerequisites

- Node.js ≥ 24.11.1, npm ≥ 11.6.2
- PostgreSQL instance (see `docker-compose.dev.yml` in the repo root)

### 1. Environment

```bash
cp .env.example .env
# Edit .env — at minimum set POSTGRES_* vars
```

### 2. Install dependencies

```bash
npm install
```

### 3. Init database and run seeds

```bash
npm run db:init    # runs schema init + TypeORM migrations
npm run db:seeds   # seeds roles and reference data
```

### 4. Start the server

```bash
npm run start:dev   # watch mode (development)
npm run start       # single run
```

API is available at `http://localhost:8080/api`.
Swagger UI is available at `http://localhost:8080/swagger`.

## Quick Start (Docker)

Use the `docker-compose.dev.yml` in the repository root:

```bash
# From the repo root
docker compose -f docker-compose.dev.yml up --build
```

The compose file starts both the API container and PostgreSQL.

## Available Scripts

| Script | Description |
|---|---|
| `npm run start` | Start server (production build must exist) |
| `npm run start:dev` | Start with file watcher (development) |
| `npm run start:debug` | Start with debug port open |
| `npm run start:prod` | Start compiled JS from `dist/` |
| `npm run build` | Compile TypeScript via Nest CLI |
| `npm run db:init` | Init schemas + run all migrations |
| `npm run db:init:hard` | Drop all schemas, re-init, run migrations |
| `npm run db:seeds` | Run database seeds (requires prior build) |
| `npm run db:build` | `db:init` + `db:seeds` |
| `npm run db:build:hard` | `db:init:hard` + `db:seeds` |
| `npm run migration:generate` | Generate a new migration (pass `--schema=` `--name=`) |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run swagger:generate` | Build project and export `swagger.openapi3.json` |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run tscheck` | Type-check without emit |
| `npm test` | Run unit tests (Jest) |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage report |

## Test

```bash
# unit tests
npm test

# unit tests with watch
npm run test:watch

# e2e tests
npm run test:e2e

# coverage report
npm run test:cov
```

## License

UNLICENSED — private project.
