# Modules Reference

Each feature module lives in `src/modules/<name>/`. This document is grouped by domain and gives a one-screen orientation per module. For deep coverage of the larger domains, see the per-domain docs linked at the bottom.

All endpoints are guarded by the global `JwtAuthGuard` (cookie-based JWT). Route handlers opt out with `@Public()`, gate by user role with `@Roles(...)`, and gate by org membership/role with `@OrgMemberRole(...)` (which composes `OrgMemberGuard`).

---

## Identity

### AuthModule

**Path**: `src/modules/auth/`
**Route prefix**: `/auth`
**Auth**: `@Public()` for signup/login/reset, `@Refresh()` for refresh, JWT for the rest.

JWT session lifecycle: signup, login, refresh, logout, and active session administration.

#### Controller — `AuthController`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register new user, create session, set cookie |
| POST | `/login` | Public | Authenticate user, create/replace session, set cookie |
| POST | `/refresh` | Refresh token | Issue new token pair, update session |
| POST | `/logout` | Required | Delete session, clear cookie |
| GET | `/current-user-sessions` | Required | Paginated list of user's sessions |
| DELETE | `/current-user-sessions/:id` | Required | Delete specific session |
| DELETE | `/current-user-sessions` | Required | Delete all sessions (logout everywhere) |

#### Internals

- **Service**: `AuthService` — token signing, session create/replace (deduplicated by IP+UA), JWT verification, expired-session cron.
- **Repository**: `AuthRepository` — session CRUD with optional user/roles relations.
- **DTOs**: `LoginRequestDto`, `SignupRequestDto`, `SessionResponseDto`.

---

### UserModule

**Path**: `src/modules/user/`
**Route prefix**: `/user`
**Auth**: JWT for own-profile actions; `@Public()` for password-reset entry points and avatar download.

User profile management: own profile, avatar upload, password change, password reset.

#### Controllers

`UserController` — `/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/current` | Required | Get own profile |
| PATCH | `/current` | Required | Update profile (name, phone, bio, favorite software) |
| POST | `/current/avatar` | Required | Upload avatar (multipart) |
| GET | `/avatar/:fileName` | Public | Download avatar (cached) |
| POST | `/change-password` | Required | Change password |
| POST | `/reset-password` | Public | Request password reset email |
| POST | `/new-password` | Public | Set new password with reset token |

`AdminController` — `/user/admin` — placeholder, all endpoints commented out.

#### Internals

- **Service**: `UserService` — PBKDF2 password hashing (sha512 / 64 bytes), creates user + meta, assigns default `user` role; password compare; meta sync (incl. `favoriteSoft` upsert via `id: 'new'`).
- **Repositories**: `UserRepository`, `UserMetaRepository`, `RoleRepository`, `UserResetPasswordRepository`.
- **DTOs**: `UserCurrentResponseDto`, `UserMetaResponseDto`, `UserCurrentUpdateRequestDto`, `UserChangePasswordRequestDto`, `UserResetPasswordRequestDto`, `UserNewPasswordRequestDto`, `UserCreateRequestDto` (internal).

---

### ApiKeysModule

**Path**: `src/modules/api-keys/`
**Route prefix**: `/api-keys`
**Auth**: JWT on the controller. The module's `ApiKeyGuard` is exported for use elsewhere (e.g. embed viewer) — it validates `X-Api-Key` / `apiKey` query against stored SHA-256 hashes and supports `@RequiredScope(...)`.

Generates and manages hashed API keys scoped to organizations. Used by the public embed viewer.

#### Controller — `ApiKeyController`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Generate new API key (raw key returned **once**) |
| GET | `/?orgId=...` | JWT | List keys for org |
| DELETE | `/:id?orgId=...` | JWT | Revoke key |

#### Internals

- **Service**: `ApiKeyService` — hashes new keys with SHA-256, stores hash; verification helper.
- **Guard / decorator**: `ApiKeyGuard`, `@RequiredScope(...)` (`src/modules/api-keys/decorators/required-scope.decorator.ts`).
- **Repository**: `ApiKeyRepository` — `findByOrgAndHash`, `verifyKey`.
- **DTOs**: `ApiKeyCreateRequestDto`, `ApiKeyResponseDto`.

---

## Content

### Models3dModule

**Path**: `src/modules/models-3d/`
**Route prefix**: `/models-3d`
**Auth**: `@Public()` for list/details/file download; `@Roles(User)` for write paths.

Lifecycle of 3D model assets: metadata CRUD, file upload, thumbnail saving, file download. Aggregates the four submodules below (`AudioModule`, `DisplayConfigModule`, `MaterialsModule`, `VersionsModule`) and depends on `WorkspacesModule`, `StorageQuotaModule`, `WebhooksModule`.

For deeper context on the model-3d domain (entity model, file pipeline, display config), see [model-3d.md](model-3d.md).

#### Controller — `Model3dController`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Paginated list of public models (filterable) |
| GET | `/current-user` | JWT | Paginated list of own models |
| GET | `/:modelId` | Public | Single model details |
| PATCH | `/:modelId` | JWT | Update model metadata |
| DELETE | `/:modelId` | JWT | Delete model + files |
| POST | `/:modelId/file` | JWT | Upload model file (multipart) |
| POST | `/:modelId/thumbnail` | JWT | Save thumbnail from base64 |
| GET | `/:modelId/file` | Public | Download model file |

#### Internals

- **Service**: `Model3dService` — transactional upload/update; file moves; ownership enforcement.
- **Repositories**: `Model3dRepository`, `Model3dFileRepository`.
- **Mappers**: `Model3dMapper` (computes `isOwner`), `Model3dFileMapper`.
- **Custom multer engine**: `src/modules/models-3d/storage-engine/model-3d.storage.engine.ts` — writes uploads to `files/models-3d/temp/` before the service moves them to the final location.
- **DTOs**: `Models3dRequestDto`, `Model3dResponseDto`, `Model3dFileResponseDto`, `Model3dUpdateRequestDto`, `UploadModel3dRequestDto`.

---

### AudioModule

**Path**: `src/modules/models-3d/audio/`
**Route prefix**: `/models-3d/:modelId/audio`
**Auth**: `@Roles(User)` on all routes; ownership enforced in the service.

Per-model audio attachments. Upload accepts `audio/mpeg|mp3|ogg|wav|x-wav|wave`, max 20 MB. Files stored via the org's `FilesService` strategy.

#### Internals

- **Controller**: `AudioController`
- **Service**: `AudioService`
- **Repository**: `ModelAudioRepository` (entity: `ModelAudioEntity`)
- **DTO**: `ModelAudioResponseDto`

---

### DisplayConfigModule

**Path**: `src/modules/models-3d/display-config/`
**Route prefix**: `/models-3d/:modelId/display-config`
**Auth**: `@Public()` for `GET`; `@Roles(User)` for mutations and HDRI/light operations.

Per-model viewer configuration: post-processing, environment, HDRI, and lighting presets. HDRI uploads max 20 MB. Get-or-create semantics: `GET` lazily creates the row.

#### Internals

- **Controller**: `DisplayConfigController` (additional `POST /hdri`, light upsert/update routes)
- **Service**: `DisplayConfigService`
- **Repositories**: `DisplayConfigRepository`, `ModelLightRepository`
- **Entities**: `ModelDisplayConfigEntity`, `ModelLightEntity`
- **DTOs**: `DisplayConfigResponseDto`, `DisplayConfigUpdateDto`, `ModelLightUpsertDto`, `ModelLightUpdateDto`

---

### MaterialsModule

**Path**: `src/modules/models-3d/materials/`
**Route prefix**: `/models-3d/:modelId/materials`
**Auth**: `@Public()` for `GET`; `@Roles(User)` for upserts and texture upload.

Material override storage per mesh (keyed by `meshName`). Texture uploads accept `image/png|jpeg|webp`, max 5 MB.

#### Internals

- **Controller**: `MaterialsController` (`PUT /:meshName`, texture upload, delete)
- **Service**: `MaterialsService`
- **Repository**: `MaterialOverrideRepository` (entity: `ModelMaterialOverrideEntity`)
- **DTOs**: `MaterialOverrideResponseDto`, `MaterialOverrideUpsertDto`

---

### VersionsModule

**Path**: `src/modules/models-3d/versions/`
**Route prefix**: `/models-3d/:modelId/versions`
**Auth**: `@Roles(User)` on all routes.

Versioned uploads of `model_version`. A model can have multiple versions; exactly one is active. Uploads land in `./files/models-3d/temp` first.

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all versions |
| POST | `/` | Upload new version (multipart) |
| PATCH | `/:versionId/activate` | Set version as active |
| DELETE | `/:versionId` | Delete version |

#### Internals

- **Service**: `VersionsService`
- **Repository**: `ModelVersionRepository`
- **Mapper**: `ModelVersionMapper`
- **DTOs**: `VersionResponseDto`, `VersionUploadRequestDto`

---

### ResourcesModule

**Path**: `src/modules/resources/`
**Route prefix**: `/resources`
**Auth**: `@Public()` on both endpoints.
**Scope**: Global (provides `CategoryRepository` and `CgSoftRepository` globally).

Reference data: 3D software options and model categories. Both lists are seeded and rarely change.

| Method | Path | Description |
|---|---|---|
| GET | `/cg-soft/all` | All CG software entries |
| GET | `/category/all` | All model categories |

#### Internals

- **Service**: `ResourcesService`
- **Repositories**: `CgSoftRepository`, `CategoryRepository` (each with batched `createMany*`).
- **DTOs**: `CgSoftResponseDto`, `CategoryResponseDto`, `CgSoftRequestDto` (id `number | 'new'`), `CategoryRequestDto`.

---

## Collaboration

### ReviewsModule

**Path**: `src/modules/reviews/`
**Route prefix**: `/models-3d/:modelId/comments`
**Auth**: `@Public()` for `GET`; `@Roles(User)` for write paths (ownership enforced in the service).

Free-text comments on a model.

| Method | Path | Description |
|---|---|---|
| GET | `/` | List comments |
| POST | `/` | Create comment |
| PATCH | `/:commentId` | Update own comment |
| DELETE | `/:commentId` | Delete own comment |

#### Internals

- **Service**: `ReviewsService`
- **Repository**: `ModelCommentRepository`
- **DTOs**: `CommentCreateRequestDto`, `CommentUpdateRequestDto`, `CommentResponseDto`

---

### AnnotationsModule

**Path**: `src/modules/annotations/`
**Route prefix**: `/models-3d/:modelId/annotations`
**Auth**: `@Public()` for `GET`; `@Roles(User)` for mutations.

3D-anchored annotations attached to a model (label + text + position). Supports reorder via `PUT /reorder`.

| Method | Path | Description |
|---|---|---|
| GET | `/` | List annotations |
| POST | `/` | Create |
| PATCH | `/:id` | Update |
| DELETE | `/:id` | Delete |
| PUT | `/reorder` | Reorder by ordered ID array |

#### Internals

- **Service**: `AnnotationsService`
- **Repository**: `ModelAnnotationRepository`
- **DTOs**: `AnnotationCreateRequestDto`, `AnnotationUpdateRequestDto`, `AnnotationReorderRequestDto`, `AnnotationResponseDto`

---

### SceneAnnotationsModule

**Path**: `src/modules/scenes/annotations/`
**Route prefix**: `/scenes/:sceneId/annotations`
**Auth**: `@Public()` for `GET`; `@Roles(User)` for mutations.

Scene-level annotations (analogous to model annotations but anchored to scenes).

| Method | Path | Description |
|---|---|---|
| GET | `/` | List annotations |
| POST | `/` | Create |
| PATCH | `/:annotId` | Update |
| DELETE | `/:annotId` | Delete |
| PUT | `/reorder` | Reorder |

#### Internals

- **Service**: `SceneAnnotationsService`
- **Repository**: `SceneAnnotationRepository`
- **Mappers**: in `mappers/`
- **DTOs**: `SceneAnnotationCreateRequestDto`, `SceneAnnotationUpdateRequestDto`, `SceneAnnotationReorderRequestDto`, `SceneAnnotationResponseDto`

---

### SceneCommentsModule

**Path**: `src/modules/scenes/comments/`
**Route prefix**: `/scenes/:sceneId/comments`
**Auth**: `@Public()` for `GET`; `@Roles(User)` for mutations.

Free-text comments attached to a scene.

| Method | Path | Description |
|---|---|---|
| GET | `/` | List comments |
| POST | `/` | Create comment |
| PATCH | `/:commentId` | Update own comment |
| DELETE | `/:commentId` | Delete own comment |

#### Internals

- **Service**: `SceneCommentsService`
- **Repository**: `SceneCommentRepository`
- **DTOs**: `SceneCommentCreateRequestDto`, `SceneCommentUpdateRequestDto`, `SceneCommentResponseDto`

---

## Tenancy

### OrganizationsModule

**Path**: `src/modules/organizations/`
**Route prefix**: `/organizations`
**Auth**: JWT globally; `@OrgMemberRole(...)` (composing `OrgMemberGuard`) for member/admin/owner gates. Invite-accept route is `@Public()`.

CRUD for organizations, member invites, role management, subscription/storage configuration. Exports `OrganizationService` and `OrgMemberRepository` for downstream modules. The exported `OrgMemberGuard` and `@OrgMemberRole` decorator are the canonical way for org-scoped features to enforce membership.

For deeper context (invite flow, storage backend swap, RBAC matrix), see [organizations.md](organizations.md).

#### Controller — `OrganizationController`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create organization |
| GET | `/current` | JWT | Orgs the user is a member of |
| POST | `/invite/accept` | Public | Accept invite by token |
| GET | `/:id` | OrgMember | Get org details |
| PATCH | `/:id` | OrgMember(Owner/Admin) | Update org |
| GET | `/:id/members` | OrgMember | List members |
| POST | `/:id/invite` | OrgMember(Owner/Admin) | Invite by email |
| PATCH | `/:id/members/:userId` | OrgMember(Owner/Admin) | Change member role |
| DELETE | `/:id/members/:userId` | OrgMember(Owner/Admin) | Remove member |
| GET | `/:id/subscription` | OrgMember(Owner/Admin) | Get subscription + storage config |
| PATCH | `/:id/subscription/storage` | OrgMember(Owner) | Update S3 / storage config |

#### Internals

- **Service**: `OrganizationService` (also delegates to `StorageQuotaService` for storage usage).
- **Repositories**: `OrganizationRepository`, `OrgMemberRepository`, `OrgInviteRepository` (org subscription is currently accessed inline via the entity `OrgSubscriptionEntity`).
- **Guard / decorator**: `OrgMemberGuard`, `@OrgMemberRole(...)`.
- **DTOs**: `OrganizationCreateRequestDto`, `OrganizationUpdateRequestDto`, `OrganizationResponseDto`, `OrgInviteCreateRequestDto`, `OrgMemberResponseDto`, `OrgMemberRoleChangeRequestDto`, `OrgSubscriptionDetailDto`, `UpdateStorageConfigRequestDto`.

---

### WebhooksModule

**Path**: `src/modules/organizations/webhooks/`
**Route prefix**: `/organizations/:id/webhooks`
**Auth**: `@OrgMemberRole(Admin)` on every route.

Outbound webhook subscriptions per organization, with HMAC-signed delivery and retry via Bull. Exports `WebhookDeliveryService` for emitter modules (e.g. models-3d).

| Method | Path | Description |
|---|---|---|
| POST | `/` | Register webhook (secret returned **once**) |
| GET | `/` | List org webhooks |
| DELETE | `/:webhookId` | Revoke |
| GET | `/:webhookId/deliveries` | Recent delivery log entries |

#### Internals

- **Services**: `WebhooksService`, `WebhookDeliveryService` (enqueues), `WebhookCryptoService` (HMAC).
- **Bull**: queue name from `webhooks.constants.ts` (`WEBHOOK_QUEUE`); processed by `WebhookProcessor`.
- **Repositories**: `WebhookRepository`, `WebhookDeliveryLogRepository`.
- **Entities**: `WebhookEntity`, `WebhookDeliveryLogEntity`.
- **DTOs**: `WebhookCreateRequestDto`, `WebhookCreateResponseDto`, `WebhookResponseDto`, `WebhookDeliveryLogResponseDto`.

---

### WorkspacesModule

**Path**: `src/modules/workspaces/`
**Route prefix**: `/workspaces`
**Auth**: `@Roles(User)` on the controller; org-membership / workspace-membership checks live inside the service (errors surface as 403).

Workspaces group scenes and models inside an organization, scoped to a subset of org members.

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create workspace |
| GET | `/?orgId=...` | List workspaces (filter by `orgId`) |
| GET | `/:id` | Workspace details |
| PATCH | `/:id` | Update workspace |
| DELETE | `/:id` | Delete workspace |
| POST | `/:id/members` | Add member |
| DELETE | `/:id/members/:userId` | Remove member |

#### Internals

- **Service**: `WorkspaceService`
- **Repositories**: `WorkspaceRepository`, `WorkspaceMemberRepository`
- **DTOs**: `WorkspaceCreateRequestDto`, `WorkspaceUpdateRequestDto`, `WorkspaceResponseDto`, `WorkspaceMemberAddRequestDto`

---

### StorageQuotaService

**Path**: `src/modules/storage-quota/`
**Scope**: Service-only module (no controller). `StorageQuotaService` is exported and imported wherever uploads happen.

Tracks and enforces per-organization storage quotas. Used by file upload flows before saving files; called from `OrganizationsModule`, `Models3dModule`, and any other module that writes large artifacts.

| Method | Description |
|---|---|
| `getUsedStorage(orgId)` | Sum of all file sizes for the org |
| `checkQuota(orgId, fileSize)` | Throws if `used + fileSize > limit` |
| `updateQuota(orgId, delta)` | Increments/decrements `storage_used` in `org_subscription` |

---

## Scenes

### ScenesModule

**Path**: `src/modules/scenes/`
**Route prefix**: `/scenes`
**Auth**: `@Roles(User)` on most routes; `@Public()` on the `using-model/:modelId` lookup and HDRI download.

Full scene management: scene CRUD, cloning, 3D object placement, light configuration, HDRI upload, thumbnail. Enabled-feature scenes attach their annotation/comment threads via `SceneAnnotationsModule` / `SceneCommentsModule`.

For deeper context on scene composition, serialization, and editor handshake, see [scenes.md](scenes.md).

#### Controller — `ScenesController` (selected routes)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create scene |
| GET | `/?workspaceId=&userId=&search=` | JWT | List scenes (filtered) |
| GET | `/using-model/:modelId` | Public | Public scenes that reference a model |
| POST | `/:id/clone` | JWT | Duplicate scene |
| GET | `/:id` | JWT | Full scene (objects + lights) |
| PATCH | `/:id` | JWT | Update metadata |
| DELETE | `/:id` | JWT | Delete |
| POST | `/:id/objects` | JWT | Add object |
| PATCH | `/:id/objects/:objId` | JWT | Update object transform |
| DELETE | `/:id/objects/:objId` | JWT | Remove object |
| POST | `/:id/lights` | JWT | Add light |
| PATCH | `/:id/lights/:lightId` | JWT | Update light |
| DELETE | `/:id/lights/:lightId` | JWT | Remove light |
| POST | `/:id/hdri` | JWT | Upload HDRI (max 20 MB) |
| GET | `/:id/hdri` | Public | Serve HDRI file |
| POST | `/:id/thumbnail` | JWT | Save thumbnail (base64 PNG) |

#### Internals

- **Service**: `ScenesService`
- **Repositories**: `SceneRepository`, `SceneObjectRepository`, `SceneLightRepository`
- **Mapper**: `SceneMapper`
- **DTOs**: `SceneCreateRequestDto`, `SceneUpdateRequestDto`, `SceneListItemResponseDto`, `SceneResponseDto`, `SceneObjectUpsertDto`, `SceneLightUpsertDto`

---

## Integration

### EmbedModule

**Path**: `src/modules/embed/`
**Route prefix**: `/embed`
**Auth**: JWT for project management routes; `@Public()` + `ApiKeyGuard` (with `@RequiredScope`) for the public viewer payload and logo serving.

Embed projects (public 3D viewer configurations), domain whitelist, logo upload, view analytics, and the public viewer endpoint consumed by external sites. Imports `ApiKeysModule`, `Models3dModule`, `OrganizationsModule`, `ScenesModule`.

For full embed-domain coverage (signed URL flow, domain enforcement, view-log retention), see [embed.md](embed.md).

#### Controller — `EmbedController` (selected routes)

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
| GET | `/:modelId` | Public + `ApiKeyGuard` | Embed viewer payload |

#### Internals

- **Service**: `EmbedService`
- **Repositories**: `EmbedProjectRepository`, `EmbedDomainWhitelistRepository`, `ModelViewLogRepository`
- **Entities**: `EmbedProjectEntity`, `EmbedDomainWhitelistEntity`, `ModelViewLogEntity`
- **DTOs**: `EmbedProjectCreateRequestDto`, `EmbedProjectUpdateRequestDto`, `EmbedProjectResponseDto`, `EmbedViewerResponseDto`, `DomainAddRequestDto`, `ViewAnalyticsResponseDto`

---

### NotificationsModule

**Path**: `src/modules/notifications/`
**Scope**: Global. Exports `NotificationsService` (email) and `InAppNotificationsService`.
**Route prefix**: `/notifications` (in-app feed only).
**Auth**: `@Roles(User)` on all in-app routes.

Email delivery (Yandex SMTP via `@nestjs-modules/mailer`) and in-app notification feed (read/unread tracking).

For full notification coverage (templates, gateway abstraction, in-app feed model), see [notifications.md](notifications.md).

#### Controller — `InAppNotificationsController`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List the caller's notifications |
| GET | `/unread-count` | Unread count |
| PATCH | `/:id/read` | Mark single notification read |
| PATCH | `/read-all` | Mark all read |

#### Internals

- **Email gateway**: `EmailGatewayModule` → `MailerService`. Skips sending when `SMTP_YANDEX_ENABLED=false`; logs failures instead of throwing.
- **Service (top-level)**: `NotificationsService` — `sendEmail(options)` delegates to the gateway.
- **Service (in-app)**: `InAppNotificationsService` — list / unread-count / mark-read.
- **Repository**: `InAppNotificationRepository` (entity: `NotificationEntity`).
- **DTOs**: `NotificationResponseDto`, `UnreadCountResponseDto`.

---

### FileStorageModule

**Path**: `src/modules/files/`
**Scope**: Global. Exports `FilesService`.

Pluggable file storage. `FilesService` resolves the right `IFileStorageStrategy` per organization at runtime via `getStrategyForOrg(orgId)`. Two strategies ship today:

| Strategy | Class | When Used |
|---|---|---|
| Local filesystem | `FsFileStorageStrategy` (`src/modules/files/strategies/fs.files.strategy.ts`) | Default; no S3 config |
| AWS S3 | `S3FileStorageStrategy` (`src/modules/files/strategies/s3.files.strategy.ts`) | Org has `s3_enabled = true` in `org_subscription` |

For the strategy interface, lifecycle, and credential decryption details, see [file-storage.md](file-storage.md).

---

## Infrastructure

### ConfigModule

**Path**: `src/modules/config/`
**Scope**: Global (available everywhere without importing).

Centralizes all environment variable reading. Feature modules never call `process.env` directly — they inject `ConfigService`.

#### Key Files

| File | Description |
|---|---|
| `config.module.ts` | Global module definition |
| `config.service.ts` | Typed getters for all config groups |
| `typeorm-naming-strategy.ts` | Custom TypeORM naming strategy (camelCase → snake_case) |

#### ConfigService Getters

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
| `redis` | `{ host, port, username, password }` |
| `isProduction` | boolean |
| `isDevelopment` | boolean |
| `isTest` | boolean |

For configuration sources, env-var contract, and runtime overrides, see [configuration.md](configuration.md).

---

## Shared Infrastructure

### Guards (`src/guards/`)

| Guard | Applied | Description |
|---|---|---|
| `JwtAuthGuard` | Global (`APP_GUARD`) | JWT validation, session loading, RBAC check |
| `ThrottlerBehindProxyGuard` | Global (`APP_GUARD`) | Rate limiting with proxy-aware IP extraction |

Domain-specific guards (`ApiKeyGuard`, `OrgMemberGuard`) live inside their owning modules.

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
| `@OrgMemberRole(...roles)` | organizations | Org-scoped membership/role gate |
| `@RequiredScope(...scopes)` | api-keys | Required API key scope (with `ApiKeyGuard`) |

### Pipes (`src/pipes/`)

| Pipe | Validates |
|---|---|
| `FileSizeValidatorPipe` | Uploaded file size <= configured max |
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
| `files.ts` | `MAX_AVATAR_FILE_SIZE` (1 MB), `ALLOWED_AVATAR_FILE_TYPES`, `MAX_3D_MODEL_FILE_SIZE` / `MODEL_MAX_SIZE_BYTES` (3 GB), `ACCEPTED_3D_MODEL_FILE_TYPES` |
| `regexp.ts` | `RussianPhone` regex (`+7XXXXXXXXXX`), `Password` regex (complexity rules) |
| `validation-error-messages.ts` | Russian validation message strings |

### Utils (`src/utils/`)

| File | Exports |
|---|---|
| `index.ts` | `isNil(value)` — true if null or undefined |
| `user-role.helper.ts` | `hasRole()`, `hasSomeRoles()`, `hasEveryRoles()` |
| `format-bytes.ts` | `formatBytes(bytes)` — human-readable size string |
| `validate-dto.ts` | `validateDto(dto)` — programmatic class-validator check |
| `encryption.ts` | `encryptAes256(...)` — used to seal org S3 credentials |

---

## Per-Domain Deep-Dive Docs

For more than the per-module thumbnail above, see:

- [organizations.md](organizations.md) — orgs, members, invites, RBAC, subscription/storage config
- [scenes.md](scenes.md) — scene composition, objects, lights, HDRI, serialization
- [embed.md](embed.md) — embed projects, domain whitelist, view analytics, viewer payload
- [model-3d.md](model-3d.md) — model lifecycle, versions, display config, materials, audio
- [notifications.md](notifications.md) — email gateway, in-app feed, templates
- [file-storage.md](file-storage.md) — `IFileStorageStrategy` interface, FS / S3 strategies
- [configuration.md](configuration.md) — env vars and config wiring
- [auth.md](auth.md) — JWT lifecycle, sessions, password reset
- [database.md](database.md) — schemas, migrations, naming
- [api.md](api.md) — top-level API map
- [architecture.md](architecture.md) — overall system shape
