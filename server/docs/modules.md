# Modules Reference

Each feature module lives in `src/modules/<name>/`. This document describes the internals of each module.

---

## ConfigModule

**Path**: `src/modules/config/`
**Scope**: Global (available everywhere without importing)

### Purpose
Centralizes all environment variable reading. Feature modules never call `process.env` directly.

### Key Files

| File | Description |
|---|---|
| `config.module.ts` | Global module definition |
| `config.service.ts` | Typed getters for all config groups |
| `typeorm-naming-strategy.ts` | Custom TypeORM naming strategy (camelCase → snake_case) |

### ConfigService Getters

| Getter | Returns |
|---|---|
| `app` | `{ host, port, mode, prefix, frontendUrl }` |
| `jwt` | `{ cookieName, algorithm, accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn }` |
| `typeOrmOptions` | Full TypeORM `DataSourceOptions` |
| `cors` | CORS options object |
| `throttlerConfig` | `ThrottlerModuleOptions` |
| `swagger` | `{ title, description, version, server }` |
| `logging` | `{ level, toFileEnabled }` |
| `fileStorage` | `{ root, avatarsDir, models3dDir }` |
| `mailer` | Yandex SMTP options |
| `isProduction` | boolean |
| `isDevelopment` | boolean |
| `isTest` | boolean |

---

## LoggerModule

**Path**: `src/modules/logger/`

### Purpose
Winston-based structured logging. Injected into services as `AppLogger`.

### AppLogger

Wraps Winston with:
- Console transport (always active)
- File transport (when `LOGS_TO_FILE_ENABLED=true`; writes to `server/.log/`)
- Log level from `LOGS_LEVEL`

Methods:
- `log(message, context?)` — INFO
- `error(error: Error | string, context?)` — ERROR with stack trace
- `warn(message, context?)` — WARN
- `debug(message, context?)` — DEBUG
- `verbose(message, context?)` — VERBOSE

---

## AuthModule

**Path**: `src/modules/auth/`

### Purpose
JWT session management: signup, login, refresh, logout, and session administration.

### Controller — `AuthController`

Route prefix: `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register new user, create session, set cookie |
| POST | `/login` | Public | Authenticate user, create/replace session, set cookie |
| POST | `/refresh` | Refresh token | Issue new token pair, update session |
| POST | `/logout` | Required | Delete session, clear cookie |
| GET | `/current-user-sessions` | Required | Paginated list of user's sessions |
| DELETE | `/current-user-sessions/:id` | Required | Delete specific session |
| DELETE | `/current-user-sessions` | Required | Delete all sessions (logout everywhere) |

### AuthService

Key methods:
- `signup(dto, ip, userAgent)` — hashes password, creates user via `UserService`, creates session
- `login(dto, ip, userAgent)` — validates credentials, creates/replaces session
- `refresh(session, ip, userAgent)` — issues new tokens, updates session
- `logout(session)` — deletes session from DB
- `getCurrentUserSessions(userId, pagination)` — paginated session list
- `closeCurrentUserSession(userId, sessionId)` — delete session by ID (validates ownership)
- `closeCurrentUserSessions(userId)` — delete all sessions for user
- `validateSession(token, isRefresh)` — decode + verify JWT, load session from DB
- `createSession(userId, ip, userAgent)` — signs tokens, persists session (with deduplication)

Cron job: cleans expired sessions periodically.

### AuthRepository

- `getSession(id, relations?)` — find session with optional user/roles relations
- `createSession(data)` — persist new session, delete existing session for same IP+userAgent first

### DTOs

| DTO | Fields |
|---|---|
| `LoginRequestDto` | `email`, `password` |
| `SignupRequestDto` | `email`, `firstName?`, `middleName?`, `lastName?`, `password`, `confirmPassword` |
| `SessionResponseDto` | `id`, `ip`, `userAgent`, `createdAt`, `expiredAt` |

---

## UserModule

**Path**: `src/modules/user/`

### Purpose
User profile management: view/update profile, avatar upload, password change, password reset.

### Controllers

#### UserController — `/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/current` | Required | Get own profile |
| PATCH | `/current` | Required | Update profile (name, phone, bio, favorite software) |
| POST | `/current/avatar` | Required | Upload avatar (multipart) |
| GET | `/avatar/:fileName` | Public | Download avatar (cached) |
| POST | `/change-password` | Required | Change password |
| POST | `/reset-password` | Public | Request password reset email |
| POST | `/new-password` | Public | Set new password with reset token |

#### AdminController — `/user/admin`

Currently placeholder — all endpoints commented out.

### UserService

Key methods:
- `getCurrentUser(userId)` — returns user with meta, roles
- `updateCurrentUser(userId, dto)` — updates user fields and meta; handles `favoriteSoft` (creates new entries with `id: 'new'`)
- `updateCurrentUserAvatar(userId, file)` — saves file via `FileStorageService`, deletes previous avatar
- `getUserById(userId, relations?)` — internal lookup
- `createUser(dto)` — hashes password with PBKDF2 (sha512, 64 bytes), creates user + meta, assigns default `user` role
- `comparePassword(raw, hash, salt)` — verifies password

### Repositories

| Repository | Main methods |
|---|---|
| `UserRepository` | `findByEmail()`, `findById()`, `findUsers()` |
| `UserMetaRepository` | `save()`, `findByUserId()` |
| `RoleRepository` | `getByName()`, `getByNames()` |
| `UserResetPasswordRepository` | `createRequest()`, `getById()`, `deleteExpiredByUser()` |

### DTOs

| DTO | Usage |
|---|---|
| `UserCurrentResponseDto` | Response for GET /user/current |
| `UserMetaResponseDto` | Nested in user response |
| `UserCurrentUpdateRequestDto` | Body for PATCH /user/current |
| `UserChangePasswordRequestDto` | Body for POST /user/change-password |
| `UserResetPasswordRequestDto` | Body for POST /user/reset-password |
| `UserNewPasswordRequestDto` | Body for POST /user/new-password |
| `UserCreateRequestDto` | Internal: used by AuthService during signup |

---

## Models3dModule

**Path**: `src/modules/models-3d/`

### Purpose
Full lifecycle management of 3D model assets: metadata CRUD, file upload, thumbnail saving, and file download.

### Controller — `Model3dController`

Route prefix: `/models-3d`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Paginated list of public models (filterable) |
| GET | `/current-user` | Required | Paginated list of own models |
| GET | `/:modelId` | Public | Single model details |
| PATCH | `/:modelId` | Required | Update model metadata |
| DELETE | `/:modelId` | Required | Delete model + files |
| POST | `/:modelId/file` | Required | Upload model file (multipart) |
| POST | `/:modelId/thumbnail` | Required | Save thumbnail from base64 |
| GET | `/:modelId/file` | Public | Download model file |

### Model3dService

Key methods:
- `get3DModel(modelId, userId?)` — returns model; `isOwner` computed from `userId`
- `get3DModels(pagination, query)` — paginated public models; supports `search` (name) and `categories` filter
- `getCurrentUser3DModels(userId, pagination, query)` — paginated own models
- `upload3DModel(modelId, userId, file)` — in a transaction: saves file, creates/updates `Model3dFileEntity`, links to model
- `delete3DModel(modelId, userId)` — validates ownership, deletes entity, deletes files
- `update3DModel(modelId, userId, dto)` — in a transaction: updates fields, syncs category relations
- `find3DModels(options)` — internal query builder with optional filters

### Repositories

| Repository | Notes |
|---|---|
| `Model3dRepository` | Standard TypeORM repository with relation loading |
| `Model3dFileRepository` | Manages `model_3d_file` entity |

### Mappers

| Mapper | Methods |
|---|---|
| `Model3dMapper` | `toModel3DResponse(entity, userId?)` — includes `isOwner` flag |
| `Model3dFileMapper` | `toModel3DFileResponse(entity)` |

### Custom Storage Engine

`src/modules/models-3d/storage-engine/model-3d.storage.engine.ts`

Custom multer `StorageEngine` that writes uploads to `files/models-3d/temp/` before the service moves them to the final location.

### DTOs

| DTO | Usage |
|---|---|
| `Models3dRequestDto` | Query params for list endpoints: `search?`, `categories[]?` |
| `Model3dResponseDto` | Single model response (includes `file`, `user`, `categories`, `isOwner`) |
| `Model3dFileResponseDto` | File metadata sub-DTO |
| `Model3dUpdateRequestDto` | Body for PATCH `/:modelId`: `name?`, `isVisible?`, `description?`, `categories[]?` |

---

## FileStorageModule

**Path**: `src/modules/files/`
**Scope**: Global

### Purpose
Abstraction layer over physical file storage. See [file-storage.md](file-storage.md) for full details.

### FileStorageService

Delegates all operations to the injected `IFileStorageStrategy`.

### FsFilesStrategy

`src/modules/files/strategies/fs.files.strategy.ts`

Local filesystem implementation:
- Uses `fs/promises` for async I/O
- Creates directories recursively as needed
- Silently ignores delete errors (file not found)

---

## ResourcesModule

**Path**: `src/modules/resources/`
**Scope**: Global (provides `CategoryRepository` and `CgSoftRepository` globally)

### Purpose
Reference data: 3D software options and model categories. Both lists are seeded and rarely change.

### Controller — `ResourcesController`

Route prefix: `/resources`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cg-soft/all` | Public | All CG software entries |
| GET | `/category/all` | Public | All model categories |

### ResourcesService

- `getAllCGSoft()` — returns all `CgSoftEntity` records
- `getAllCategories()` — returns all `CategoryEntity` records

### Repositories

| Repository | Key Methods |
|---|---|
| `CgSoftRepository` | `createCGSoft()`, `createManyCGSoft()` (batch with chunking) |
| `CategoryRepository` | `createCategory()`, `createManyCategories()` (batch with chunking) |

### DTOs

| DTO | Fields |
|---|---|
| `CgSoftResponseDto` | `id`, `name`, `description` |
| `CategoryResponseDto` | `id`, `name`, `description` |
| `CgSoftRequestDto` | `id` (number \| `'new'`), `name` — used in user profile update |
| `CategoryRequestDto` | `id` (number) — used in model update |

---

## ReviewsModule

**Path**: `src/modules/reviews/`

### Purpose
Handles model comments (`model_comment`) and 3D annotations (`model_annotation`) — nested under `/models-3d/:modelId/`.

### Controller — `ReviewsController`

Route prefix: `/models-3d/:modelId/comments`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Paginated comments for a model |
| POST | `/` | JWT | Create comment |
| PATCH | `/:commentId` | JWT (owner) | Update own comment |
| DELETE | `/:commentId` | JWT (owner) | Delete own comment |

### Controller — `AnnotationsController`

Route prefix: `/models-3d/:modelId/annotations`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | All annotations for a model |
| POST | `/` | JWT | Create annotation |
| PATCH | `/:id` | JWT (owner) | Update annotation |
| DELETE | `/:id` | JWT (owner) | Delete annotation |
| PUT | `/reorder` | JWT | Reorder annotations (pass ordered ID array) |

### DTOs

| DTO | Fields |
|---|---|
| `ModelCommentResponseDto` | `id`, `text`, `rating`, `createdAt`, `author` |
| `CreateCommentDto` | `text`, `rating` |
| `ModelAnnotationResponseDto` | `id`, `label`, `text`, `position`, `order` |
| `CreateAnnotationDto` | `label`, `text`, `position` (`{x,y,z}`) |

---

## VersionsModule

**Path**: `src/modules/versions/`

### Purpose
Manages versioned model file uploads for `model_version`. Each model can have multiple file versions; exactly one is active (displayed) at a time.

### Controller — `VersionsController`

Route prefix: `/models-3d/:modelId/versions`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List all versions |
| POST | `/` | JWT | Upload new version (multipart) |
| PATCH | `/:versionId/activate` | JWT | Set version as active |
| DELETE | `/:versionId` | JWT | Delete version |

### DTOs

| DTO | Fields |
|---|---|
| `ModelVersionResponseDto` | `id`, `versionNumber`, `isActive`, `filename`, `size`, `createdAt` |

---

## OrganizationsModule

**Path**: `src/modules/organizations/`

### Purpose
Organization management: CRUD, member invites, role management, subscription/storage config.

### Controller — `OrganizationsController`

Route prefix: `/organizations`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create organization |
| GET | `/current` | JWT | Orgs the user is a member of |
| POST | `/invite/accept` | Public | Accept invite by token |
| GET | `/:id` | JWT (member) | Get org details |
| PATCH | `/:id` | JWT (owner/admin) | Update org |
| GET | `/:id/members` | JWT (member) | List members |
| POST | `/:id/invite` | JWT (owner/admin) | Invite by email |
| PATCH | `/:id/members/:userId` | JWT (owner/admin) | Change member role |
| DELETE | `/:id/members/:userId` | JWT (owner/admin) | Remove member |
| GET | `/:id/subscription` | JWT (owner/admin) | Get subscription + storage config |
| PATCH | `/:id/subscription/storage` | JWT (owner) | Update S3 / storage config |

### Repositories

| Repository | Key Methods |
|---|---|
| `OrganizationRepository` | CRUD, `findByOwner`, `findByMember` |
| `OrgMemberRepository` | `findByOrg`, `findByUserAndOrg`, `upsert` |
| `OrgSubscriptionRepository` | `findByOrg`, `updateStorageConfig` |
| `OrgInviteRepository` | `createInvite`, `findByToken`, `deleteByToken` |

### DTOs

| DTO | Fields |
|---|---|
| `OrgResponseDto` | `id`, `name`, `slug`, `ownerId`, `createdAt` |
| `OrgMemberResponseDto` | `userId`, `role`, `joinedAt`, `user` |
| `OrgSubscriptionResponseDto` | `plan`, `storageLimit`, `storageUsed`, `s3Enabled` |
| `CreateOrgDto` | `name`, `slug` |
| `InviteOrgMemberDto` | `email`, `role` |

---

## WorkspacesModule

**Path**: `src/modules/workspaces/`

### Purpose
Workspace management scoped under an organization. Workspaces group scenes and are accessible to a subset of org members.

### Controller — `WorkspacesController`

Route prefix: `/workspaces`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create workspace |
| GET | `/` | JWT | List workspaces (filter by `orgId`) |
| GET | `/:id` | JWT (member) | Get workspace details |
| PATCH | `/:id` | JWT (admin) | Update workspace |
| DELETE | `/:id` | JWT (admin) | Delete workspace |
| POST | `/:id/members` | JWT (admin) | Add member |
| DELETE | `/:id/members/:userId` | JWT (admin) | Remove member |

### DTOs

| DTO | Fields |
|---|---|
| `WorkspaceResponseDto` | `id`, `name`, `orgId`, `memberCount`, `createdAt` |
| `CreateWorkspaceDto` | `name`, `orgId` |

---

## ApiKeysModule

**Path**: `src/modules/api-keys/`

### Purpose
Generates and manages hashed API keys scoped to organizations. Keys are used by the embed viewer to authenticate requests.

### Controller — `ApiKeysController`

Route prefix: `/api-keys`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Generate new API key |
| GET | `/` | JWT | List keys for org (`orgId` query) |
| DELETE | `/:id` | JWT | Revoke key (`orgId` query) |

### Notes
- Raw key returned **once** on creation only. Stored as SHA-256 hash.
- Validation via `ApiKeyGuard` checks `X-Api-Key` header or `apiKey` query param against stored hashes.

---

## EmbedModule

**Path**: `src/modules/embed/`

### Purpose
Manage embed projects (public 3D viewer configurations), domain whitelist, logo upload, analytics, and the public viewer endpoint.

### Controller — `EmbedController`

Route prefix: `/embed`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/projects` | JWT | Create embed project |
| GET | `/projects` | JWT | List projects (`orgId` filter) |
| PATCH | `/projects/:id` | JWT | Update project settings |
| POST | `/projects/:id/domains` | JWT | Add allowed domain |
| DELETE | `/projects/:id/domains/:domain` | JWT | Remove allowed domain |
| GET | `/projects/:id/analytics` | JWT | Paginated view log |
| POST | `/projects/:id/logo` | JWT | Upload logo |
| GET | `/projects/:id/logo` | Public | Serve logo file |
| GET | `/:modelId` | Public + ApiKeyGuard | Embed viewer payload |

### Repositories

| Repository | Key Methods |
|---|---|
| `EmbedProjectRepository` | CRUD, `findByOrg` |
| `ApiKeyRepository` | `findByOrgAndHash`, `verifyKey` |
| `ModelViewLogRepository` | `createLog`, `findByProject` (paginated) |

### DTOs

| DTO | Fields |
|---|---|
| `EmbedProjectResponseDto` | `id`, `name`, `modelId`, `orgId`, `domains[]`, `logo` |
| `EmbedViewerResponseDto` | full model + project config for the public viewer |
| `CreateEmbedProjectDto` | `name`, `modelId`, `orgId` |

---

## ScenesModule

**Path**: `src/modules/scenes/`

### Purpose
Full scene management: scene CRUD, 3D object placement, light configuration, HDRI upload, and thumbnail saving.

### Controller — `ScenesController`

Route prefix: `/scenes`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create scene |
| GET | `/` | JWT | List scenes (`workspaceId` filter) |
| GET | `/:id` | JWT | Get full scene (objects + lights) |
| PATCH | `/:id` | JWT | Update scene metadata |
| DELETE | `/:id` | JWT | Delete scene |
| POST | `/:id/objects` | JWT | Add object to scene |
| PATCH | `/:id/objects/:objId` | JWT | Update object transform |
| DELETE | `/:id/objects/:objId` | JWT | Remove object |
| POST | `/:id/lights` | JWT | Add light |
| PATCH | `/:id/lights/:lightId` | JWT | Update light |
| DELETE | `/:id/lights/:lightId` | JWT | Remove light |
| POST | `/:id/hdri` | JWT | Upload HDRI (max 20 MB) |
| GET | `/:id/hdri` | Public | Serve HDRI file |
| POST | `/:id/thumbnail` | JWT | Save thumbnail (base64 PNG) |

### Repositories

| Repository | Key Methods |
|---|---|
| `SceneRepository` | CRUD, `findByWorkspace`, `loadWithRelations` |
| `SceneObjectRepository` | `addObject`, `updateObject`, `removeObject` |
| `SceneLightRepository` | `addLight`, `updateLight`, `removeLight` |

### DTOs

| DTO | Fields |
|---|---|
| `SceneListItemResponseDto` | `id`, `name`, `objectCount`, `createdAt`, `updatedAt` |
| `SceneResponseDto` | `id`, `name`, `hdriPath`, `objects[]`, `lights[]`, `cameraBookmark` |
| `SceneObjectResponseDto` | `id`, `position`, `rotation`, `scale`, `model` (nested with file info) |
| `SceneLightResponseDto` | `id`, `type`, `color`, `intensity`, `position` |
| `CreateSceneDto` | `name`, `workspaceId` |
| `AddSceneObjectDto` | `modelId`, `position`, `rotation`, `scale` |
| `AddSceneLightDto` | `type`, `color`, `intensity`, `position` |
| `SaveSceneThumbnailDto` | `thumbnail` (base64 PNG) |

---

## StorageQuotaModule

**Path**: `src/modules/storage-quota/`
**Scope**: Exported service, no controller.

### Purpose
Tracks and enforces per-organization storage quotas. Used by file upload flows before saving files.

### StorageQuotaService

| Method | Description |
|---|---|
| `getUsedStorage(orgId)` | Sum of all file sizes for the org |
| `checkQuota(orgId, fileSize)` | Throws if `used + fileSize > limit` |
| `updateQuota(orgId, delta)` | Increments/decrements `storage_used` in `org_subscription` |

---

## FileStorageModule

**Path**: `src/modules/files/`
**Scope**: Global

### Purpose
Provides `FileStorageService` backed by a pluggable `IFileStorageStrategy`. Strategy is resolved per-org at runtime via `getStrategyForOrg(orgId)`.

### Strategies

| Strategy | Class | When Used |
|---|---|---|
| Local filesystem | `FsFileStorageStrategy` | Default; no S3 config |
| AWS S3 | `S3FileStorageStrategy` | Org has `s3_enabled = true` in `org_subscription` |

See [`file-storage.md`](file-storage.md) for full interface and lifecycle documentation.

---

## NotificationsModule

**Path**: `src/modules/notifications/`
**Scope**: Global

### Purpose
Email delivery abstraction. Currently backed by Yandex SMTP via `@nestjs-modules/mailer`.

### NotificationsService

- `sendEmail(options)` — delegates to `EmailGatewayService`

### EmailGatewayService

`src/modules/notifications/gateways/email-gateway/email-gateway.service.ts`

- Uses `MailerService` from `@nestjs-modules/mailer`
- Supports single or multiple recipients
- Logs errors on send failure instead of propagating exceptions
- Skips sending when `SMTP_YANDEX_ENABLED=false`

---

## Shared Infrastructure

### Guards (`src/guards/`)

| Guard | Applied | Description |
|---|---|---|
| `JwtAuthGuard` | Global (`APP_GUARD`) | JWT validation, session loading, RBAC check |
| `ThrottlerBehindProxyGuard` | Global (`APP_GUARD`) | Rate limiting with proxy-aware IP extraction |

### Interceptors (`src/interceptors/`)

| Interceptor | Applied | Description |
|---|---|---|
| `LoggingInterceptor` | Global | Logs all requests and responses |
| `CookiesInterceptor` | Global (`APP_INTERCEPTOR`) | Manages JWT HttpOnly cookie |

### Decorators (`src/decorators/`)

| Decorator | Module | Purpose |
|---|---|---|
| `@Public()` | auth | Skip JWT auth |
| `@Refresh()` | auth | Use refresh token |
| `@Roles(...roles)` | auth | RBAC requirement |
| `@AuthGuard()` | auth | Composite: `@Roles(User)` + Swagger security |
| `@User()` | user | Inject `UserEntity` from session |
| `@OptionalUser()` | user | Inject user or `undefined` |
| `@PaginatedRequest()` | pagination | Extract + parse pagination from query |
| `@PaginatedResponse(Dto)` | pagination | Swagger response schema annotation |

### Pipes (`src/pipes/`)

| Pipe | Validates |
|---|---|
| `FileSizeValidatorPipe` | Uploaded file size ≤ configured max |
| `FileTypeValidatorPipe` | MIME type in whitelist |
| `FileExtensionValidatorPipe` | File extension in whitelist |

### Exception (`src/exceptions/`)

`AppHttpException` — extends NestJS `HttpException`. Produces structured JSON:
```json
{
  "error": "Unauthorized",
  "type": "AuthError",
  "status": 401,
  "message": "...",
  "data": null
}
```

### Constants (`src/constants/`)

| File | Contents |
|---|---|
| `roles.ts` | `UserRoles` enum: `SuperUser`, `Admin`, `User` |
| `files.ts` | `MAX_AVATAR_FILE_SIZE` (1 MB), `ALLOWED_AVATAR_FILE_TYPES`, `MAX_3D_MODEL_FILE_SIZE` (3 GB), `ACCEPTED_3D_MODEL_FILE_TYPES` |
| `regexp.ts` | `RussianPhone` regex (`+7XXXXXXXXXX`), `Password` regex (complexity rules) |
| `validation-error-messages.ts` | Russian validation message strings |

### Utils (`src/utils/`)

| File | Exports |
|---|---|
| `index.ts` | `isNil(value)` — true if null or undefined |
| `user-role.helper.ts` | `hasRole()`, `hasSomeRoles()`, `hasEveryRoles()` |
| `format-bytes.ts` | `formatBytes(bytes)` — human-readable size string |
| `validate-dto.ts` | `validateDto(dto)` — programmatic class-validator check |
