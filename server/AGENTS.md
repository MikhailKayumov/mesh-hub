# AGENTS.md — MeshHub Server

This file is written for LLM coding agents. It describes the architecture, conventions, and how to safely extend the codebase.

---

## Project Overview

NestJS 11 REST API backend for the MeshHub platform — a 3D model sharing service. Provides JWT-based auth with DB sessions, user management, 3D model file uploads, and reference data (categories, CG software).

- **Entry point**: `src/main.ts` → `src/app.bootstrap.ts`
- **Root module**: `src/app.module.ts`
- **Database**: PostgreSQL with TypeORM 0.3 (4 schemas: `auth`, `users`, `resources`, `model_3d`)
- **Global prefix**: `/api` (configured via `APP_GLOBAL_PREFIX` env var)
- **Swagger UI**: `/swagger`

---

## Module Map

```
src/
├── app.module.ts          # Root module — imports all feature modules
├── app.bootstrap.ts       # Application factory (middleware, guards, pipes, swagger)
├── main.ts                # Process entry, calls AppBootstrap
│
├── modules/
│   ├── auth/              # JWT auth, session CRUD, signup/login/logout
│   ├── user/              # Profile, avatar upload, password change/reset
│   ├── models-3d/         # 3D model CRUD, file upload, thumbnail
│   ├── files/             # File storage abstraction (filesystem strategy)
│   ├── resources/         # Categories and CG software reference data
│   ├── notifications/     # Email sending via Yandex SMTP
│   ├── logger/            # Winston logger service
│   └── config/            # Environment-based configuration (global)
│
├── database/
│   ├── entities/          # TypeORM entity classes (one file per entity)
│   ├── migrations/        # TypeORM migrations (grouped by schema)
│   ├── seeds/             # Seed scripts (roles, categories)
│   └── init/              # Schema creation scripts (run before migrations)
│
├── guards/
│   ├── auth/jwt-auth.guard.ts    # Global JWT guard (reads cookie)
│   └── throttler-behind-proxy.guard.ts
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
├── pipes/
│   ├── file-size-validator.pipe.ts
│   ├── file-type-validator.pipe.ts
│   └── file-extension-validator.pipe.ts
│
├── exceptions/
│   └── app-http.exception.ts    # Unified error response shape
│
├── constants/
│   ├── roles.ts           # UserRoles enum
│   ├── files.ts           # File size limits and MIME type lists
│   ├── regexp.ts          # Password and phone regexes
│   └── validation-error-messages.ts  # Russian error message strings
│
├── types/
│   └── index.d.ts         # Express Request augmentation (session, jwtPayload)
│
└── utils/
    ├── index.ts            # isNil()
    ├── user-role.helper.ts # hasRole(), hasSomeRoles(), hasEveryRoles()
    └── format-bytes.ts     # Byte formatting utility
```

---

## Architecture Patterns

### Repository Pattern
Every entity has a dedicated repository class in its module's `repositories/` folder. Repositories extend TypeORM's `Repository<Entity>` and are injected via `@InjectRepository()`. Direct `EntityManager` queries go through the repository, not services.

### Mapper Pattern
Dedicated mapper classes (in `mappers/`) convert entities to DTOs and DTOs to entities. Services call mappers before returning responses. Mappers are plain classes with static or instance methods — not NestJS providers.

### Strategy Pattern (File Storage)
`FileStorageModule` exports a `FileStorageService` backed by an `IFileStorageStrategy` implementation. Currently the only strategy is `FsFilesStrategy` (local filesystem). To add a new storage backend (e.g., S3), implement the `IFileStorageStrategy` interface and swap the provider.

### Pagination
All list endpoints use `PaginationDto` (query params: `skip`, `size`, `sort[]`) and return `PaginationResponseDto<T>` (`data[]`, `skip`, `size`, `sort[]`, `totalCount`, `hasMore`). Use the `@PaginatedRequest()` decorator to extract pagination from the query, and `@PaginatedResponse(DtoClass)` to annotate the Swagger response.

Sort format: `+fieldName` (ASC) or `-fieldName` (DESC). The pagination decorator parses these into `PaginationDtoSortItem[]`.

### Global Providers (applied to every request)
1. `ThrottlerBehindProxyGuard` — rate limiting, extracts real IP from X-Forwarded-For
2. `JwtAuthGuard` — validates JWT from cookie, attaches `session` and `jwtPayload` to `req`
3. `CookiesInterceptor` — sets/clears the JWT cookie on responses

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
| Migration | `{timestamp}-{PascalCaseName}.ts` | `1703017999243-Init.ts` |
| DB schema | `snake_case` | `model_3d` |
| DB table | `snake_case` | `model_3d_file` |
| DB column | `snake_case` | `user_meta_id` |
| Path aliases | `@/` maps to `src/` | `import { X } from '@/modules/...'` |

---

## Auth Conventions

- Every endpoint is **authenticated by default** via the global `JwtAuthGuard`.
- Use `@Public()` to opt a route out of authentication (reads refresh or no token).
- Use `@Refresh()` to require the refresh token instead of the access token (used on `POST /auth/refresh`).
- Use `@Roles(UserRoles.Admin)` to restrict an endpoint to specific roles.
- Inject the authenticated user with `@User() user: UserEntity` in controller params.
- Inject an optional user (for public endpoints that also support logged-in context) with `@OptionalUser() user: UserEntity | undefined`.
- JWT is transmitted **only via HttpOnly cookie** (name controlled by `AUTH_JWT_COOKIE_NAME` env var). Do not use Authorization header.

---

## Database Conventions

- All entities extend one of: `GuidIdEntityBase` (UUID PK) or `IntIdBaseEntity` (serial int PK).
- Both base classes include `createdAt`, `updatedAt`, `deletedAt` columns (soft-delete support).
- Entities are organized in `src/database/entities/` grouped by schema (`user/`, `session/`, `models-3d/`, `resources/`).
- Table names and schema names are defined as string constants in `src/database/constants.ts` — always reference these constants in `@Entity()`, `@JoinTable()`, etc.
- Migrations live in `src/database/migrations/` grouped by schema subfolder.
- To generate a new migration: `npm run migration:generate -- --schema=<schema> --name=<MigrationName>` (Windows: use `migration:generate:win`).

---

## How to Add a New Feature Module

1. Create `src/modules/<name>/` with:
   - `<name>.module.ts` — `@Module({ imports, controllers, providers, exports })`
   - `controllers/<name>.controller.ts`
   - `services/<name>.service.ts`
   - `repositories/<name>.repository.ts`
   - `mappers/<name>.mapper.ts`
   - `dto/<name>.response.dto.ts`, `dto/<name>.request.dto.ts`

2. Add the entity in `src/database/entities/<schema>/<name>.entity.ts`. Extend `GuidIdEntityBase` or `IntIdBaseEntity`. Add entity constants in `src/database/constants.ts`.

3. Import `TypeOrmModule.forFeature([EntityClass])` in the feature module.

4. Generate a migration: `npm run migration:generate -- --schema=<schema> --name=Add<Name>`.

5. Import the feature module in `src/app.module.ts`.

---

## How to Add a New Endpoint

1. Add a method to the controller with the appropriate HTTP decorator (`@Get`, `@Post`, `@Patch`, `@Delete`).
2. Apply auth decorators as needed: `@Public()`, `@Roles(...)`, `@AuthGuard()`.
3. Use `@User()` or `@OptionalUser()` to access the authenticated user.
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

Migration files are generated in `src/database/migrations/<schema>/`.

---

## Environment Configuration

All configuration is centralized in `src/modules/config/config.service.ts`. Access config anywhere by injecting `ConfigService`. Do not use `process.env` directly in feature code — always go through `ConfigService`.

See [docs/configuration.md](docs/configuration.md) for the full environment variable reference.

---

## File Storage

The `FileStorageModule` is globally available. Inject `FileStorageService` to save/delete files. The service delegates to `IFileStorageStrategy` — currently `FsFilesStrategy` (local disk under `server/files/`).

- Avatars: `files/avatars/<userId>.<ext>` (max 1 MB, image types only)
- 3D models: `files/models-3d/<modelId>/<filename>` (max 3 GB, `.glb`/`.gltf`)
- Thumbnails: `files/models-3d/<modelId>/thumbnail.png`

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

## Key Dependencies

| Package | Purpose |
|---|---|
| `@nestjs/jwt` | JWT sign/verify |
| `@nestjs/typeorm` | TypeORM integration |
| `@nestjs/swagger` | OpenAPI doc generation |
| `@nestjs/schedule` | Cron jobs (session cleanup) |
| `@nestjs/throttler` | Rate limiting |
| `@nestjs/bull` | Job queues (Bull/Redis) |
| `@nestjs-modules/mailer` | Email sending |
| `class-validator` + `class-transformer` | DTO validation and transformation |
| `cookie-parser` | Cookie parsing for JWT transport |
| `typeorm` | ORM + migrations |
| `pg` | PostgreSQL driver |
| `winston` | Logging |
| `date-fns` | Date utilities |
