# AGENTS.md — MeshHub Server

This file is written for LLM coding agents. It describes the architecture, conventions, and how to safely extend the codebase.

---

## Project Overview

NestJS 11 REST API backend for the MeshHub platform — a multi-tenant 3D model and scene collaboration service. Provides JWT-based auth with DB sessions, organization/workspace tenancy, model + scene CRUD, an embeddable public viewer, webhooks, and in-app + email notifications.

- **Entry point**: `src/main.ts` → `src/app.bootstrap.ts`
- **Root module**: `src/app.module.ts`
- **Database**: PostgreSQL 18 with TypeORM 0.3 — **9 schemas**: `auth`, `users`, `resources`, `model_3d`, `organizations`, `workspaces`, `embed`, `scenes`, `notifications` (declared in [src/database/constants.ts](src/database/constants.ts))
- **Global prefix**: `/api` (configured via `APP_GLOBAL_PREFIX` env var)
- **Swagger UI**: `/swagger` (setup in `src/app.bootstrap.ts`, document built by `src/swagger/swagger.service.ts`)

---

## Module Map

The root module (`src/app.module.ts`) wires the following feature modules. Some umbrella modules (e.g. `Models3dModule`) compose submodules internally — those are listed nested.

### Identity
- `auth/` — JWT auth, session CRUD, signup/login/logout, password reset
- `user/` — profile, avatar upload, password change/reset, user meta
- `api-keys/` — server-to-server API keys with scopes (sha256-hashed at rest, validated by `ApiKeyGuard`)

### Content
- `models-3d/` — 3D model CRUD, file upload, thumbnail, per-model storage routing. Composes:
  - `models-3d/audio/` — audio track attachments per model
  - `models-3d/display-config/` — viewer HDRI + lights overlay
  - `models-3d/materials/` — per-mesh material override + textures
  - `models-3d/versions/` — file version history with active-version pointer
- `resources/` — categories and CG software reference data
- `annotations/` — world-space markers on models
- `reviews/` — threaded review/comment threads on models

### Tenancy
- `organizations/` — org CRUD, members (`Owner > Admin > Editor > Viewer`), invites, subscriptions, per-org S3 storage config (encrypted)
  - `organizations/webhooks/` — HMAC-signed outbound webhooks dispatched via Bull queue
- `workspaces/` — workspaces inside an org with their own member list (`Editor | Viewer`)
- `storage-quota/` — service-only module that checks per-org storage and seat limits before mutations (consumed by `Models3dModule`, `OrganizationsModule`, etc.)

### Scenes
- `scenes/` — scene CRUD, scene objects (model references), scene lights, HDRI environment, thumbnail. Composes:
  - `scenes/annotations/` — world-space annotations on scenes (separate from model annotations)
  - `scenes/comments/` — threaded comments on scenes

### Integration
- `embed/` — public embed projects (publish a model or scene as a public viewer with API-key access, domain whitelist, view logs)
- `notifications/` — in-app notification persistence + email dispatch (one global module covers both channels)
- `files/` — `FileStorageService` + `IFileStorageStrategy` (Fs / S3) + ZIP extraction

### Infrastructure
- `config/` — global `ConfigService` (env-typed)
- `logger/` — `AppLogger` Winston wrapper (consoles + optional file)
- `src/swagger/` — OpenAPI document factory (consumed by `app.bootstrap.ts`, **not** a feature module)

### Directory tree

```
src/
├── app.module.ts          # Root module — imports all feature modules
├── app.bootstrap.ts       # Application factory (middleware, guards, pipes, swagger)
├── main.ts                # Process entry, calls AppBootstrap
│
├── modules/               # Feature modules (see Module Map above)
│
├── database/
│   ├── entities/          # TypeORM entity classes, grouped by schema folder
│   ├── migrations/        # TypeORM migrations
│   ├── seeds/             # Seed scripts (roles, categories)
│   ├── init/              # Schema creation scripts (run before migrations)
│   ├── constants.ts       # Schema + table name constants
│   └── data.source.ts     # Standalone DataSource for the TypeORM CLI
│
├── guards/
│   ├── auth/jwt-auth.guard.ts          # Global JWT guard (reads cookie)
│   └── throttler-behind-proxy.guard.ts # Rate limit guard with X-Forwarded-For
│
├── interceptors/
│   ├── logging.interceptor.ts   # Request/response logging
│   └── cookies.interceptor.ts   # Sets JWT cookies on response
│
├── decorators/
│   ├── auth/              # @Public(), @Refresh(), @Roles(), @AuthGuard()
│   ├── user/              # @User(), @OptionalUser()
│   ├── pagination/        # @PaginatedRequest(), @PaginatedResponse()
│   └── validation/        # @Validate(IsNumberOrStringDecorator)
│
├── pipes/                 # File size / type / extension validation pipes
│
├── exceptions/
│   └── app-http.exception.ts    # Unified error response shape
│
├── constants/             # roles, files, regexp, validation messages
│
├── swagger/               # OpenAPI document factory
│
├── types/
│   └── index.d.ts         # Express Request augmentation (session, jwtPayload, orgMember, apiKey)
│
└── utils/
    ├── index.ts            # isNil()
    ├── user-role.helper.ts # hasRole(), hasSomeRoles(), hasEveryRoles()
    ├── format-bytes.ts     # Byte formatting utility
    ├── encryption.ts       # AES-256-CBC encrypt/decrypt helpers
    ├── sleep.ts
    └── validate-dto.ts
```

---

## Architecture Patterns

### Repository Pattern
Every entity has a dedicated repository class in its module's `repositories/` folder. Repositories extend TypeORM's `Repository<Entity>` and are injected via `@InjectRepository()`. Direct `EntityManager` queries go through the repository, not services.

### Mapper Pattern
Dedicated mapper classes (in `mappers/`) convert entities to DTOs and DTOs to entities. Services call mappers before returning responses. Mappers are plain classes with static or instance methods — not NestJS providers.

### Strategy Pattern (File Storage)
`FileStorageModule` exports `FileStorageService` backed by an `IFileStorageStrategy`. Two implementations exist:
- `FsFileStorageStrategy` — local filesystem under `server/files/` (default).
- `S3FileStorageStrategy` — per-organization S3 / S3-compatible backend, instantiated lazily from the org's encrypted `storage_config_encrypted` blob on `OrgSubscriptionEntity`.

`FileStorageService` reads the org subscription, decrypts the config with `decryptAes256` (key = `STORAGE_ENCRYPTION_KEY`), and routes the call to the appropriate strategy. See [docs/file-storage.md](docs/file-storage.md).

### Pagination
All list endpoints use `PaginationDto` (query params: `skip`, `size`, `sort[]`) and return `PaginationResponseDto<T>` (`data[]`, `skip`, `size`, `sort[]`, `totalCount`, `hasMore`). Use the `@PaginatedRequest()` decorator to extract pagination from the query, and `@PaginatedResponse(DtoClass)` to annotate the Swagger response.

Sort format: `+fieldName` (ASC) or `-fieldName` (DESC). The pagination decorator parses these into `PaginationDtoSortItem[]`.

### Global Providers (applied to every request)
1. `ThrottlerBehindProxyGuard` — rate limiting, extracts real IP from X-Forwarded-For
2. `JwtAuthGuard` — validates JWT from cookie, attaches `session` and `jwtPayload` to `req`
3. `CookiesInterceptor` — sets/clears the JWT cookie on responses

### Per-Module Auth Guards (applied with `@UseGuards(...)` on controllers/handlers)
- `OrgMemberGuard` ([src/modules/organizations/guards/org-member.guard.ts](src/modules/organizations/guards/org-member.guard.ts)) — looks up the `OrgMemberEntity` for the authenticated user against the `:id` path param, attaches it to `req.orgMember`, and enforces the minimum-role threshold declared via `@OrgMemberRole(...)`. Roles are weighted (`Owner > Admin > Editor > Viewer`).
- `ApiKeyGuard` ([src/modules/api-keys/guards/api-key.guard.ts](src/modules/api-keys/guards/api-key.guard.ts)) — reads `x-api-key` header, sha256-hashes it, looks up the (non-revoked, non-expired) `ApiKeyEntity`, enforces the scope declared via `@RequiredScope(...)`, and attaches it to `req.apiKey`. Used by public embed/integration endpoints.

These run **in addition** to the global `JwtAuthGuard`. Endpoints that require an API key instead of a session use `@Public()` + `@UseGuards(ApiKeyGuard)`.

### Encryption
`src/utils/encryption.ts` exposes `encryptAes256(plaintext, keyHex)` / `decryptAes256(ciphertext, keyHex)` (AES-256-CBC, random 16-byte IV, hex-encoded `<iv>:<ciphertext>` output). Both reuse the **same** `STORAGE_ENCRYPTION_KEY` env var (read via `ConfigService.storageEncryptionKey`) for two purposes:
- Per-org S3 credentials in `org_subscription.storage_config_encrypted`
- Webhook secrets in `organizations.webhooks.WebhookCryptoService`

### Storage Quota
`StorageQuotaService` ([src/modules/storage-quota/storage-quota.service.ts](src/modules/storage-quota/storage-quota.service.ts)) is consulted **before** every model upload (`checkStorageQuotaByWorkspace`) and **before** every member invite (`checkSeatsQuota`). It compares aggregate usage against `org_subscription.storage_limit_bytes` / `seats_limit`; on overflow it throws `AppHttpException` with `HTTP 402 Payment Required`. The module is imported on demand by consumers (`Models3dModule`, `OrganizationsModule`, …) — it is not a global module.

### Error Handling
Throw `AppHttpException` (from `src/exceptions/app-http.exception.ts`) for application errors. It produces a structured JSON body `{ error, type, status, message, data }`. The global `ValidationPipe` also wraps class-validator errors into `AppHttpException` with `type: 'ValidationError'`.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Module folder | `kebab-case` | `models-3d/` |
| Entity file | `kebab-case.entity.ts` | `model-3d-file.entity.ts` |
| Entity class | `PascalCase` + `Entity` suffix | `Model3dFileEntity` |
| DTO file | `kebab-case.[qualifier].dto.ts` | `model-3d.update.request.dto.ts` |
| DTO class | `PascalCase` | `Model3dUpdateRequestDto` |
| Controller | one per module (sometimes `admin.controller.ts` + `[name].controller.ts`) | `model-3d.controller.ts` |
| Service | `[name].service.ts` | `model-3d.service.ts` |
| Repository | `[name].repository.ts` | `model-3d.repository.ts` |
| Mapper | `[name].mapper.ts` | `model-3d.mapper.ts` |
| Guard | `[name].guard.ts` | `jwt-auth.guard.ts` |
| Interceptor | `[name].interceptor.ts` | `logging.interceptor.ts` |
| Migration | `{timestamp}-{PascalCaseName}.ts` | `1777486474931-Init.ts` |
| DB schema | `snake_case` | `model_3d` |
| DB table | `snake_case` | `model_3d_file` |
| DB column | `snake_case` | `user_meta_id` |
| Path aliases | `@/` maps to `src/` | `import { X } from '@/modules/...'` |

---

## Auth Conventions

- Every endpoint is **authenticated by default** via the global `JwtAuthGuard`.
- Use `@Public()` to opt a route out of authentication (reads refresh or no token).
- Use `@Refresh()` to require the refresh token instead of the access token (used on `POST /auth/refresh`).
- Use `@Roles(UserRoles.Admin)` to restrict an endpoint to specific platform roles.
- Use `@OrgMemberRole(...)` + `@UseGuards(OrgMemberGuard)` to restrict an endpoint by org-membership role (requires `:id` path param to be the org id).
- Use `@RequiredScope(...)` + `@UseGuards(ApiKeyGuard)` (with `@Public()` on the handler) to restrict an endpoint by API key scope.
- Inject the authenticated user with `@User() user: UserEntity` in controller params.
- Inject an optional user (for public endpoints that also support logged-in context) with `@OptionalUser() user: UserEntity | undefined`.
- JWT is transmitted **only via HttpOnly cookie** (name controlled by `AUTH_JWT_COOKIE_NAME` env var). Do not use Authorization header.

---

## Database Conventions

- All entities extend one of: `GuidIdEntityBase` (UUID PK) or `IntIdBaseEntity` (serial int PK).
- Both base classes include `createdAt`, `updatedAt`, `deletedAt` columns (soft-delete support).
- Entities live in `src/database/entities/` grouped by folder. Folder ↔ schema mapping is declared in `src/database/constants.ts`:

  | Folder | Schema |
  |---|---|
  | `entities/user/` | `users` |
  | `entities/session/` | `auth` |
  | `entities/resources/` | `resources` |
  | `entities/models-3d/` | `model_3d` |
  | `entities/organizations/` | `organizations` |
  | `entities/workspaces/` | `workspaces` |
  | `entities/embed/` | `embed` |
  | `entities/scenes/` | `scenes` |
  | `entities/notifications/` | `notifications` |

- Table names and schema names are exported as string constants in `src/database/constants.ts` — always reference these constants in `@Entity()`, `@JoinTable()`, etc.
- Migrations live under `src/database/migrations/` and are picked up via the glob `src/database/migrations/**/*.ts` ([src/database/data.source.ts](src/database/data.source.ts)).
- To generate a new migration: `npm run migration:generate -- --schema=<schema> --name=<MigrationName>` (Windows: use `migration:generate:win`). The `--schema` flag controls the per-schema subfolder destination.

See [docs/database.md](docs/database.md) for the full schema reference.

---

## How to Add a New Feature Module

1. Create `src/modules/<name>/` with:
   - `<name>.module.ts` — `@Module({ imports, controllers, providers, exports })`
   - `controllers/<name>.controller.ts`
   - `services/<name>.service.ts`
   - `repositories/<name>.repository.ts`
   - `mappers/<name>.mapper.ts`
   - `dto/<name>.response.dto.ts`, `dto/<name>.request.dto.ts`

2. Add the entity in `src/database/entities/<folder>/<name>.entity.ts`. Extend `GuidIdEntityBase` or `IntIdBaseEntity`. Add entity constants in `src/database/constants.ts`.

3. Import `TypeOrmModule.forFeature([EntityClass])` in the feature module.

4. Generate a migration: `npm run migration:generate -- --schema=<schema> --name=Add<Name>`.

5. Import the feature module in `src/app.module.ts`.

6. If the feature is org-scoped, import `StorageQuotaModule` and `WebhooksModule` as needed, and apply `OrgMemberGuard` + `@OrgMemberRole(...)` on every controller method.

For module-specific patterns and existing surface details, consult the per-domain docs:

| Domain | Doc |
|---|---|
| Organizations / workspaces / webhooks | [docs/organizations.md](docs/organizations.md) |
| Scenes (objects, lights, annotations, comments) | [docs/scenes.md](docs/scenes.md) |
| Embed (projects, API keys, domain whitelist, view logs) | [docs/embed.md](docs/embed.md) |
| Models 3D (versions, display config, materials, audio, annotations, comments) | [docs/model-3d.md](docs/model-3d.md) |
| Notifications (in-app + email) | [docs/notifications.md](docs/notifications.md) |

---

## How to Add a New Endpoint

1. Add a method to the controller with the appropriate HTTP decorator (`@Get`, `@Post`, `@Patch`, `@Delete`).
2. Apply auth decorators as needed: `@Public()`, `@Roles(...)`, `@OrgMemberRole(...)`, `@RequiredScope(...)`, plus `@UseGuards(OrgMemberGuard | ApiKeyGuard)` where appropriate.
3. Use `@User()` or `@OptionalUser()` to access the authenticated user; use `req.orgMember` / `req.apiKey` after the corresponding guard.
4. For paginated lists: use `@PaginatedRequest() pagination: PaginationDto` and return `PaginationResponseDto<T>`.
5. Add the corresponding service method and (if needed) repository query.
6. Add input DTO with class-validator decorators; the global `ValidationPipe` handles transformation and validation automatically.

---

## How to Add a New Migration

```bash
# Linux/Mac
npm run migration:generate -- --schema=<schema_name> --name=<MigrationName>

# Windows
npm run migration:generate:win --schema=<schema_name> --name=<MigrationName>

# Apply
npm run migration:run

# Revert last
npm run migration:revert
```

Migration files are generated under `src/database/migrations/` (subfolder controlled by `--schema`).

---

## Environment Configuration

All configuration is centralized in `src/modules/config/config.service.ts`. Access config anywhere by injecting `ConfigService`. Do not use `process.env` directly in feature code — always go through `ConfigService`.

See [docs/configuration.md](docs/configuration.md) for the full environment variable reference.

---

## File Storage

`FileStorageModule` is globally available. Inject `FileStorageService` to save/delete files; the service routes per-organization between strategies:

- `FsFileStorageStrategy` — local disk under `server/files/` (default for orgs without S3 config).
- `S3FileStorageStrategy` — per-org S3 / S3-compatible backend, instantiated from the decrypted `org_subscription.storage_config_encrypted`. Returns pre-signed URLs (1 h TTL) from `getFileUrl()`; the controller responds with a 307 redirect.

Layout (relative to the chosen backend root):

- Avatars: `avatars/<userId>.<ext>` (max 1 MB, image types only)
- 3D models: `models-3d/<modelId>/<filename>` (max 3 GB, `.glb`/`.gltf`/zip extracted)
- Thumbnails: `models-3d/<modelId>/thumbnail.png`
- Model versions: `models-3d/<modelId>/versions/<versionId>/...`
- Model display HDRI: `models-3d/<modelId>/display-hdri.hdr`
- Model material textures: `models-3d/<modelId>/materials/<overrideId>/<type>.<ext>`
- Model audio: `models-3d/<modelId>/audio/<audioId>.<ext>`
- Scene HDRI: `scenes/<sceneId>/environment.hdr`
- Scene thumbnail: `scenes/<sceneId>/thumbnail.png`
- Embed logo: `embed/<projectId>/logo.<ext>`

See [docs/file-storage.md](docs/file-storage.md) for full details.

---

## Logging

Inject `AppLogger` (from `src/modules/logger/logger.service.ts`) in any provider for structured logging. It wraps Winston with console and optional file transports. Log level is controlled by `LOGS_LEVEL` env var.

---

## Testing

**All test files live under `server/test/`, never alongside source.** Each kind has its own subfolder with its own Jest config and required environment.

```
server/test/
├── unit/                    # pure unit tests (mocked dependencies, no DB / network)
│   ├── jest.config.json
│   └── <module>/<thing>.spec.ts
└── e2e/                     # end-to-end tests (real Nest app via Supertest)
    ├── jest.config.json
    └── <feature>.e2e-spec.ts
```

- Unit specs match `test/unit/**/*.spec.ts`, e2e specs match `test/e2e/**/*.e2e-spec.ts`.
- Both configs set `rootDir` to `server/` so `@/...` imports resolve via `moduleNameMapper` to `src/`.
- Adding a new test kind (integration, contract, smoke, …) means creating `test/<kind>/jest.config.json` plus a script in `package.json` — never co-locating specs with source.
- Run scripts:
  - `npm test` → `jest --config ./test/unit/jest.config.json`
  - `npm run test:e2e` → `jest --config ./test/e2e/jest.config.json`
- Use Supertest for e2e; mock external services (S3, mail) inside the spec or via `Test.overrideProvider(...)`.

---

## Documentation

All long-form docs live in `server/docs/` and are linked from this file. They are the source of truth for module-specific patterns and surface area.

| Doc | Scope |
|---|---|
| [docs/architecture.md](docs/architecture.md) | High-level architecture, layering, request lifecycle |
| [docs/modules.md](docs/modules.md) | Per-module internals reference |
| [docs/api.md](docs/api.md) | REST API surface (endpoints, auth, payloads) |
| [docs/auth.md](docs/auth.md) | Auth flow, JWT cookie handling, sessions, password reset |
| [docs/database.md](docs/database.md) | Schemas, tables, relations, conventions |
| [docs/configuration.md](docs/configuration.md) | Environment variables and config service |
| [docs/file-storage.md](docs/file-storage.md) | File storage strategies, paths, S3 routing |
| [docs/organizations.md](docs/organizations.md) | Org/workspace/webhook tenancy domain |
| [docs/scenes.md](docs/scenes.md) | Scenes, scene objects, lights, annotations, comments |
| [docs/embed.md](docs/embed.md) | Embed projects, API keys, domain whitelist, view logs |
| [docs/model-3d.md](docs/model-3d.md) | Models 3D umbrella domain (versions, display config, materials, audio) |
| [docs/notifications.md](docs/notifications.md) | In-app + email notifications |

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `@nestjs/jwt` | JWT sign/verify |
| `@nestjs/typeorm` | TypeORM integration |
| `@nestjs/swagger` | OpenAPI doc generation |
| `@nestjs/schedule` | Cron jobs (session cleanup) |
| `@nestjs/throttler` | Rate limiting |
| `@nestjs/bull` | Job queues (Bull/Redis) — used for webhook delivery |
| `@nestjs-modules/mailer` | Email sending |
| `@aws-sdk/client-s3` + `@aws-sdk/lib-storage` + `@aws-sdk/s3-request-presigner` | Per-org S3 file storage |
| `class-validator` + `class-transformer` | DTO validation and transformation |
| `cookie-parser` | Cookie parsing for JWT transport |
| `typeorm` | ORM + migrations |
| `pg` | PostgreSQL driver |
| `winston` | Logging |
| `date-fns` | Date utilities |
