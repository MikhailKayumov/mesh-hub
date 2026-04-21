# Architecture

## Overview

MeshHub Server is a monolithic NestJS application with a modular structure. Each feature domain is encapsulated in its own module under `src/modules/`. The application follows a layered architecture within each module.

```
HTTP Request
    │
    ▼
[ThrottlerBehindProxyGuard]  ← global rate limiting
    │
    ▼
[JwtAuthGuard]               ← global JWT validation, session lookup
    │
    ▼
[Controller]                 ← route handling, DTO extraction, pipe application
    │
    ▼
[Service]                    ← business logic, orchestrates repositories
    │
    ▼
[Repository]                 ← database queries (TypeORM)
    │
    ▼
[PostgreSQL]
    │
    ▼ (response)
[Mapper]                     ← entity → DTO transformation (called from service)
    │
    ▼
[CookiesInterceptor]         ← sets/clears JWT cookie
    │
    ▼
HTTP Response
```

---

## Module Dependency Graph

```
AppModule
├── ConfigModule (global)          ← all modules inject ConfigService
├── NotificationsModule (global)   ← email gateway
├── FileStorageModule (global)     ← file I/O strategy
├── ResourcesModule (global)       ← categories & CG software
├── TypeOrmModule (root)           ← single DB connection
├── ThrottlerModule (root)
├── ScheduleModule (root)          ← cron jobs
├── UserModule
│   └── uses: FileStorageModule, NotificationsModule
├── AuthModule
│   └── uses: UserModule, ConfigModule
└── Models3dModule
    └── uses: FileStorageModule, ResourcesModule
```

---

## Application Bootstrap

`src/app.bootstrap.ts` — `AppBootstrap` class:

1. `NestFactory.create()` — creates the Express-backed NestJS application
2. `setGlobalPrefix('/api')` — all routes prefixed with `/api`
3. `set('trust proxy', 1)` — enables proxy-aware IP detection
4. Cookie parser middleware (`cookie-parser`)
5. JSON body parser (1 MB limit) + URL-encoded body parser
6. CORS configured from `ConfigService.cors`
7. `LoggingInterceptor` registered globally
8. `ValidationPipe` registered globally (transforms, whitelist, custom error factory)
9. Swagger document generated via `SwaggerService`, served at `/swagger`
10. `app.listen()` on configured `host:port`

---

## Global Providers

| Provider | Type | Purpose |
|---|---|---|
| `ThrottlerBehindProxyGuard` | `APP_GUARD` | Rate limiting (TTL / limit from config), real IP from proxy headers |
| `JwtAuthGuard` | `APP_GUARD` | JWT authentication on every request; respects `@Public()` and `@Refresh()` |
| `CookiesInterceptor` | `APP_INTERCEPTOR` | Sets/clears HttpOnly JWT cookie in every response |

Guard execution order (NestJS convention): guards are applied in the order they are declared in `providers`. `ThrottlerBehindProxyGuard` runs before `JwtAuthGuard`.

---

## Design Patterns

### Repository Pattern

Each entity has a dedicated repository class inside its module's `repositories/` directory. Repositories:
- Extend TypeORM's `Repository<Entity>`
- Are registered with `TypeOrmModule.forFeature([Entity])` in the feature module
- Are injected into services via `@InjectRepository()`
- Encapsulate all query logic — services never call `EntityManager` directly

### Mapper Pattern

Each module contains a `mappers/` directory with mapper classes. Mappers are responsible for converting TypeORM entities to response DTOs and request DTOs to entity fields. Services call mappers before returning data.

Mappers are plain TypeScript classes (not NestJS providers) with methods such as:
- `toXxxResponse(entity)` — entity → DTO
- `fromXxxRequest(dto)` — DTO → partial entity or plain object

### Strategy Pattern (File Storage)

`FileStorageModule` provides `FileStorageService` backed by a pluggable `IFileStorageStrategy`. The current implementation is `FsFilesStrategy` (local filesystem). To add a new backend (e.g., AWS S3), implement `IFileStorageStrategy` and inject it as the strategy provider.

### Pagination Pattern

All list endpoints use the standardized pagination system:
- Input: `PaginationDto` — `skip` (number), `size` (number), `sort` (array of `+field`/`-field` strings)
- Output: `PaginationResponseDto<T>` — `data[]`, `skip`, `size`, `sort[]`, `totalCount`, `hasMore`
- `@PaginatedRequest()` decorator extracts and parses pagination from query params
- `@PaginatedResponse(DtoClass)` decorator annotates the Swagger response schema

### Session-Based Auth

Sessions are persisted in the `auth.session` database table. A JWT access token and refresh token are issued per session. The `JwtAuthGuard` validates the token and loads the full `SessionEntity` (with user + roles) on every request, making it available as `req.session`. This enables session invalidation (logout, session management) without needing a token blacklist.

---

## Database Schema Layout

Four PostgreSQL schemas are used to organize tables:

| Schema | Tables |
|---|---|
| `auth` | `session` |
| `users` | `user`, `user_meta`, `role`, `user_role` (join), `user_reset_password` |
| `resources` | `cg_soft`, `category` |
| `model_3d` | `model_3d`, `model_3d_file`, `model_3d_categories` (join) |

All schema and table names are defined as constants in `src/database/constants.ts`.

---

## Request Lifecycle (detailed)

1. **Rate limit check** — `ThrottlerBehindProxyGuard` increments hit count per IP per TTL window. Exceeding the limit throws `ThrottlerException` (429).
2. **JWT guard** — `JwtAuthGuard`:
   - Checks for `@Public()` metadata → skips auth if present
   - Reads JWT from cookie (`AUTH_JWT_COOKIE_NAME`)
   - Checks for `@Refresh()` metadata → validates refresh token instead of access token
   - Decodes and verifies token signature
   - Loads `SessionEntity` from DB (validates it exists and is not expired)
   - Checks `@Roles()` metadata → throws 403 if user lacks required roles
   - Attaches `session` and `jwtPayload` to `req`
3. **Controller** — extracts route params, query, body. Applies pipes (file validators, etc.). Calls service.
4. **Service** — executes business logic. Uses repositories for DB access. Calls mapper for output.
5. **Repository** — builds and executes TypeORM query.
6. **Mapper** — converts entity to DTO.
7. **CookiesInterceptor** — if response contains new token data, sets the cookie.
8. **LoggingInterceptor** — logs method, URL, status, IP, user agent, handler name.

---

## File Storage Layout

```
server/files/
├── avatars/
│   └── <userId>.<ext>          # e.g., abc123.jpg
└── models-3d/
    └── <modelId>/
        ├── <filename>.<ext>    # .glb or .gltf
        └── thumbnail.png       # optional
```

Temp uploads are stored in `files/models-3d/temp/` before being moved to the model's directory.

---

## Cron Jobs

| Module | Job | Schedule | Purpose |
|---|---|---|---|
| `AuthModule` | `cleanExpiredSessions()` | Configurable (Cron) | Removes expired sessions from the DB |

---

## Swagger / OpenAPI

The Swagger document is generated at application startup by `SwaggerService` (`src/swagger/swagger.service.ts`). It:
- Scans all controllers decorated with NestJS Swagger decorators
- Adds Bearer authentication and Cookie authentication schemes
- Is served at `/swagger` (UI) and exported to `swagger.openapi3.json` (for use by the code generator in `codegen/`)

To regenerate the static JSON file:

```bash
npm run swagger:generate
```
