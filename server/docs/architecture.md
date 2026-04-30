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
├── FileStorageModule (global)     ← file I/O strategy (local or S3)
├── ResourcesModule (global)       ← categories & CG software
├── TypeOrmModule (root)           ← single DB connection
├── ThrottlerModule (root)
├── ScheduleModule (root)          ← cron jobs
├── StorageQuotaModule             ← quota checks, service-only
├── UserModule
│   └── uses: FileStorageModule, NotificationsModule
├── AuthModule
│   └── uses: UserModule, ConfigModule
├── Models3dModule
│   └── uses: FileStorageModule, ResourcesModule
├── ReviewsModule          ← comments + annotations
│   └── uses: Models3dModule
├── VersionsModule
│   └── uses: FileStorageModule, Models3dModule
├── OrganizationsModule
│   └── uses: NotificationsModule, StorageQuotaModule
├── WorkspacesModule
│   └── uses: OrganizationsModule
├── ApiKeysModule
│   └── uses: OrganizationsModule
├── EmbedModule
│   └── uses: FileStorageModule, ApiKeysModule
└── ScenesModule
    └── uses: FileStorageModule, WorkspacesModule
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

## Per-Module Guards

In addition to the two global guards, two module-scoped guards are opted in via decorators on individual controllers/handlers. They run after `JwtAuthGuard` (or independently of it, in the `@Public()` API-key case).

| Guard | File | Decorator | Purpose |
|---|---|---|---|
| `OrgMemberGuard` | `src/modules/organizations/guards/org-member.guard.ts` | `@OrgMemberRole(...)` (`src/modules/organizations/guards/org-member-role.decorator.ts`) | Loads org membership from the `:id` route param + `req.session.user.id`, attaches it as `request.orgMember`, and enforces a minimum role. |
| `ApiKeyGuard` | `src/modules/api-keys/guards/api-key.guard.ts` | `@RequiredScope(scope)` (`src/modules/api-keys/decorators/required-scope.decorator.ts`) | Validates the `x-api-key` header against `embed.api_key.key_hash` and enforces a required scope. Used by embed-public endpoints (typically combined with `@Public()` to bypass JWT). |

### `OrgMemberGuard`

- Reads `:id` from the route params (org-scoped controllers expose the org UUID as `:id`).
- Looks up the `(orgId, userId)` pair via `OrgMemberRepository.findByOrgAndUser`. Missing membership → 403.
- Sets `request.orgMember` so downstream handlers can read the membership without re-querying.
- Reads required roles from `ORG_MEMBER_ROLE_KEY` metadata. Roles are compared by weight (`OrgMemberRoleWeights` in `src/database/entities/organizations/org-member.entity.ts`):

  | Role | Weight |
  |---|---|
  | `owner` | 3 |
  | `admin` | 2 |
  | `editor` | 1 |
  | `viewer` | 0 |

  The handler's required weight is `min(weights)` of the listed roles; the caller's weight must be `>=` that threshold or the guard throws 403.

### `ApiKeyGuard`

- Hashes the raw `x-api-key` header with SHA-256 and looks up `embed.api_key` by `key_hash` (raw secret is never persisted).
- Rejects revoked or expired keys (401).
- If `@RequiredScope(scope)` is set, asserts the scope is present in `api_key.scopes` (otherwise 403 via `AppHttpException`).
- Best-effort updates `last_used_at` (fire-and-forget).
- Attaches the `ApiKeyEntity` as `request.apiKey`. Available scopes are defined in `src/modules/api-keys/api-key.constants.ts` (`embed:read`, `read:models`, `read:scenes`).

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

`FilesModule` provides `FilesService` (`src/modules/files/files.service.ts`) backed by a pluggable `IFileStorageStrategy`.

- **`FsFileStorageStrategy`** (`src/modules/files/strategies/fs.files.strategy.ts`) — default; stores files on the local filesystem under `server/files/`. Held as a single instance on the service; initialized in `onApplicationBootstrap`.
- **`S3FileStorageStrategy`** (`src/modules/files/strategies/s3.files.strategy.ts`) — implemented; backed by AWS S3 SDK v3. Per-org bucket and credentials are read from `org_subscription.storage_config_encrypted` (AES-256-CBC, see [Encryption](#encryption)) and a fresh strategy instance is constructed for each request.

`FilesService.getStrategyForOrg(orgId)` looks up the `OrgSubscriptionEntity`; if `storageBackend === 's3'` and `storageConfigEncrypted` is set, it decrypts the JSON config with `decryptAes256` and returns a new `S3FileStorageStrategy`. Otherwise it falls back to the local strategy. Decrypt failures surface as `InternalServerErrorException` ("File storage configuration error"). Org-scoped helpers on `FilesService` (`saveModelVersionForOrg`, `saveSceneHdri`, `saveModelDisplayHdri`, `saveModelMaterialTexture`, `saveModelAudio`, etc.) all route through `getStrategyForOrg`; the legacy non-`ForOrg` helpers stay on the local strategy.

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

Eight PostgreSQL schemas are used to organize tables:

| Schema | Tables |
|---|---|
| `auth` | `session` |
| `users` | `user`, `user_meta`, `role`, `user_role` (join), `user_reset_password` |
| `resources` | `cg_soft`, `category` |
| `model_3d` | `model_3d`, `model_3d_file`, `model_3d_categories` (join), `model_comment`, `model_annotation`, `model_version` |
| `organizations` | `organization`, `org_member`, `org_subscription`, `org_invite` |
| `workspaces` | `workspace`, `workspace_member` |
| `embed` | `api_key`, `embed_project`, `embed_domain_whitelist`, `model_view_log` |
| `scenes` | `scene`, `scene_object`, `scene_light` |

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
├── models-3d/
│   └── <modelId>/
│       ├── <filename>.<ext>    # .glb or .gltf
│       └── thumbnail.png       # optional
├── scenes/
│   └── <sceneId>/
│       ├── hdri.hdr            # optional HDRI (max 20 MB)
│       └── thumbnail.png       # optional
└── embed/
    └── logos/
        └── <projectId>.<ext>   # embed project logo (max 1 MB)
```

Temp uploads are stored in `files/models-3d/temp/` before being moved to the model's directory.

In S3 mode the same key structure is used inside the org's S3 bucket.

---

## Encryption

Symmetric AES-256-CBC helpers live in `src/utils/encryption.ts`:

| Function | Signature | Output / Behaviour |
|---|---|---|
| `encryptAes256` | `(plaintext: string, keyHex: string) => string` | Generates a random 16-byte IV and returns `<ivHex>:<ciphertextHex>`. |
| `decryptAes256` | `(ciphertext: string, keyHex: string) => string` | Splits on `:`, throws on malformed input or wrong key, returns the original UTF-8 plaintext. |

Both helpers consume the same `STORAGE_ENCRYPTION_KEY` (hex-encoded 32-byte key) exposed via `ConfigService.storageEncryptionKey`. There is no per-feature key derivation — encrypted blobs from different features are interchangeable as long as they round-trip with this single key.

Current callers:

| Caller | What is encrypted |
|---|---|
| `FilesService.getStrategyForOrg` (`src/modules/files/files.service.ts`) | Reads `org_subscription.storage_config_encrypted` — the org's per-org S3 bucket + credentials JSON. |
| `WebhookCryptoService` (`src/modules/organizations/webhooks/services/webhook-crypto.service.ts`) | Encrypts/decrypts webhook signing secrets (`webhook.secret`). Also exposes `generateSecret()` (32 random bytes hex). |

---

## Storage Quota

`StorageQuotaService` (`src/modules/storage-quota/storage-quota.service.ts`) is the single place that enforces per-org plan limits. The module is global (`StorageQuotaModule`), exporting only the service — there is no controller.

| Method | Purpose |
|---|---|
| `getStorageUsed(orgId)` | Sums `model_3d_file.size` for non-deleted models across all workspaces in the org (raw `dataSource.query`). |
| `getSubscription(orgId)` | Loads the `OrgSubscriptionEntity` for the org. |
| `checkStorageQuota(orgId)` | Throws `AppHttpException(402)` if `storage_limit_bytes` is set and `getStorageUsed >= limit`. No-op when limit is null. |
| `checkSeatsQuota(orgId)` | Throws `AppHttpException(402)` if `seats_limit` is set and current member count `>= limit`. |
| `checkStorageQuotaByWorkspace(workspaceId)` | Resolves the workspace's `orgId` and delegates to `checkStorageQuota`. |

Current call sites on `mvp`:

- `OrganizationController` — surfaces usage on subscription detail endpoints.
- `Model3dService.upload3DModel` — calls `checkStorageQuotaByWorkspace` before saving (only when an explicit `workspaceId` is supplied).

Integration into other write paths (scenes, model versions, embed assets, avatar/logo uploads) is **not** wired yet on `mvp` — those endpoints currently bypass the quota check.

---

## Webhook Queue

Webhooks live under `src/modules/organizations/webhooks/` and use BullMQ for delivery:

- `BullModule.registerQueue({ name: WEBHOOK_QUEUE })` is declared in `webhooks.module.ts` (`WEBHOOK_QUEUE = 'webhooks'`, see `webhooks.constants.ts`).
- `WebhookDeliveryService.dispatch(orgId, event, payload)` is the producer: it loads active webhooks subscribed to the event via `WebhookRepository.findActiveForEvent` and enqueues one `WEBHOOK_DELIVER_JOB` per webhook with `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: true }`. Errors during enqueue are logged and swallowed — never surfaced to the caller.
- `WebhookProcessor` (`@Processor(WEBHOOK_QUEUE)`) is the consumer:
  1. Reloads the webhook; skips inactive/deleted ones.
  2. Decrypts the AES-encrypted `webhook.secret` via `WebhookCryptoService` (see [Encryption](#encryption)).
  3. Builds the body `{ event, payload, deliveredAt }` and signs it with HMAC-SHA-256 using the **decrypted** secret.
  4. POSTs to `webhook.url` with `Content-Type: application/json`, `X-Webhook-Signature: sha256=<hex>`, and `X-Webhook-Event: <event>`. 10-second `AbortController` timeout.
  5. Persists a `WebhookDeliveryLogEntity` (with response status / `deliveredAt` / `failedAt`) and re-throws on failure so Bull retries per the queue's `attempts`/`backoff` config.

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
- Is served at `/swagger` (UI) and exported to `swagger.openapi3.json`

To regenerate the static JSON file:

```bash
npm run swagger:generate
```

---

## See Also

Per-domain reference docs in `server/docs/`:

- [organizations.md](organizations.md) — orgs, members, subscriptions, invites, webhooks
- [scenes.md](scenes.md) — scene composition (objects, lights, HDRI)
- [embed.md](embed.md) — embed projects, public viewer, API keys, view logs
- [model-3d.md](model-3d.md) — model upload, versions, comments, annotations
- [notifications.md](notifications.md) — email gateway and templates

