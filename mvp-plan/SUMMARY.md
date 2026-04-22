# MeshHub MVP — Implementation Summary

> **Update this file after completing each step.**
> Status: `TODO` → `IN PROGRESS` → `DONE`

## Progress

| Step | Block | Title | Status | Notes |
|---|---|---|---|---|
| STEP-0 | Pre-MVP | Critical Fixes (FS, Migration, Security) | DONE | |
| STEP-1 | 1 | DB Entities — Orgs & Workspaces | DONE | |
| STEP-2 | 1 | Organizations Module Backend | DONE | |
| STEP-3 | 1 | Workspaces Module Backend | DONE | |
| STEP-4 | 1 | Frontend — Orgs/Workspaces | DONE | |
| STEP-5 | 1.5 | ZIP Support Backend | DONE | |
| STEP-6 | 1.5 | ZIP Support Frontend | DONE | |
| STEP-7 | 2 | StorageQuota + OrgSubscription | DONE | |
| STEP-8 | 2 | S3 File Strategy | DONE | |
| STEP-9 | 3 | API Keys + Embed Entities | TODO | |
| STEP-10 | 3 | Embed Module Backend | TODO | |
| STEP-11 | 3 | Embed Frontend | TODO | |
| STEP-12 | 4 | Reviews + Annotations Backend | TODO | |
| STEP-13 | 4 | Reviews Frontend + Viewer Extensions | TODO | |
| STEP-14 | 5 | Versions (Full Stack) | TODO | |
| STEP-15 | 6 | Scenes Backend | TODO | |
| STEP-16 | 6 | Scenes Frontend | TODO | |

## Completed Steps Log

| Step | Date | Notes |
|---|---|---|
| STEP-0 | 2026-04-22 | All three fixes applied — FS path, visibility migration, path traversal |
| STEP-1 | 2026-04-22 | DB schemas, 6 entities, 2 migrations for organizations & workspaces |
| STEP-2 | 2026-04-22 | Full Organizations module — CRUD, membership, invite flow, OrgMemberGuard |
| STEP-3 | 2026-04-22 | Full Workspaces module — CRUD, member management, workspaceId on Model3d, workspace-scoped visibility filter |
| STEP-4 | 2026-04-22 | RTK Query org/workspace API, org Redux slice (persisted), OrgCreate/OrgDashboard pages, QuotaBar/OrgSwitcher widgets, Header integration |
| STEP-5 | 2026-04-22 | ZIP upload support — adm-zip extraction, entryFile column + migration, wildcard file serving route |
| STEP-6 | 2026-04-22 | ZIP frontend — .zip added to accepted types, entryFile in DTOs, all call sites updated, UI hint in upload modal |
| STEP-7 | 2026-04-22 | StorageQuotaModule, quota checks on upload, GET subscription endpoint, frontend QuotaBar wired to real data |
| STEP-8 | 2026-04-22 | AWS SDK v3, AES-256-CBC encryption util, S3FileStorageStrategy, FilesService.getStrategyForOrg, presigned URL redirect, admin S3 config endpoint + frontend UI |

## Known Issues / Decisions Made

| Date | Decision |
|---|---|
| 2026-04-22 | FS directories keyed by `modelId`, not `fileEntityId` (see STEP-0) |
| 2026-04-22 | `SceneEntity.workspaceId` is NOT NULL — no personal scenes on MVP |
| 2026-04-22 | `WorkspaceMember.role` enum: `editor \| viewer` (owner/admin only at org level) |
| 2026-04-22 | `EmbedProject` has no FK to `ApiKey` — any org key authorizes embed requests |
| 2026-04-22 | `StorageQuotaModule` is a standalone module imported by both Orgs and Models3d |
| 2026-04-22 | Embed iframe postMessage validates `event.origin` against domain whitelist |


## STEP-0 SUMMARY

### Fix 1 — FS path uses `modelId` (not `fileEntityId`)
- **model-3d.service.ts**: Reordered `upload3DModel()` — file entity + model entity are both saved to DB first, then `filesService.save3DModel(savedModel.id, file)` uses `model.id`; cleanup tracking changed from `savedFileId` → `savedModelId`
- `delete3DModel()` and `save3DModelThumbnailFromBase64()` changed to pass `model.id` instead of `model.file.id`
- **Client** — `getModel3DFileSrc`/`getThumbnailSrc` parameter renamed to `modelId`; all 4 call sites updated to pass `model.id` instead of `model.file.id`

### Fix 2 — `visibility` enum replaces broken `"isVisible"` column
- New `ModelVisibility` enum (`public | private | unlisted`) in models-3d.ts
- `Model3dEntity`: `isVisible: boolean` → `visibility: ModelVisibility`
- New migration 1745280000000-FixVisibilityColumnAndAddEnum.ts — creates the `model_visibility` enum type, adds `visibility` column, migrates data from the old camelCase column, then drops it
- Updated model-3d.response.dto.ts, model-3d.update.request.dto.ts, model-3d.mapper.ts, service filter, and client dto.ts/`EditPropertiesDrawer/constants.ts`

### Fix 3 — Path traversal in file serving
- Replaced `join()` with `resolve()` + a `safeResolvePath()` private method that throws `ForbiddenException` if the resolved path escapes the per-model base directory
- Both endpoints renamed `:fileId` → `:modelId` and now use `ParseUUIDPipe` to additionally block UUID-shaped traversal


## STEP-1 SUMMARY

### Constants — `server/src/database/constants.ts`
- Added `Organizations: 'organizations'` and `Workspaces: 'workspaces'` to `DatabaseSchemas`
- Added `OrganizationsSchemaTables = { Organization, OrgMember, OrgSubscription, OrgInvite }` constant object
- Added `WorkspacesSchemaTables = { Workspace, WorkspaceMember }` constant object
- No changes to `init/index.ts` — it already iterates all `DatabaseSchemas` values to `CREATE SCHEMA IF NOT EXISTS`; new schemas are created automatically on next `db:init` run

### Entities — `server/src/database/entities/organizations/`
- **`organization.entity.ts`** — `name: text`, `slug: text` (unique), `planType: PlanType`; enum `PlanType { starter | growth | enterprise }`
- **`org-member.entity.ts`** — `role: OrgMemberRole`; FK `org_id → organizations.organization`, FK `user_id → users.user`; composite unique `(org_id, user_id)` via `@Unique`; enum `OrgMemberRole { owner | admin | editor | viewer }`
- **`org-subscription.entity.ts`** — `storageLimitBytes: bigint?`, `seatsLimit: int?`, `storageBackend: StorageBackend`, `storageConfigEncrypted: text?`; OneToOne FK `org_id → organizations.organization` (unique); enum `StorageBackend { local | s3 }`
- **`org-invite.entity.ts`** — `invitedEmail: text`, `role: OrgMemberRole`, `token: uuid` (unique), `expiresAt: timestamptz`, `acceptedAt: timestamptz?`; FK `org_id → organizations.organization`; reuses `OrgMemberRole` from `org-member.entity.ts`

### Entities — `server/src/database/entities/workspaces/`
- **`workspace.entity.ts`** — `name: text`; FK `org_id → organizations.organization`
- **`workspace-member.entity.ts`** — `role: WorkspaceMemberRole`; FK `workspace_id → workspaces.workspace`, FK `user_id → users.user`; composite unique `(workspace_id, user_id)` via `@Unique`; enum `WorkspaceMemberRole { editor | viewer }`

### Migrations
- **`migrations/organizations/1745280001000-InitOrganizations.ts`** — creates 3 enum types (`plan_type`, `org_member_role`, `storage_backend`); creates 4 tables (`organization`, `org_member`, `org_subscription`, `org_invite`) with all FK constraints; `down()` drops FKs → tables → enum types in reverse order
- **`migrations/workspaces/1745280002000-InitWorkspaces.ts`** — creates 1 enum type (`workspace_member_role`); creates 2 tables (`workspace`, `workspace_member`) with FK constraints including cross-schema FK to `organizations.organization`; `down()` drops FKs → tables → enum type in reverse order

### Decisions
- No SQL init files — existing `init/index.ts` approach is sufficient; enum types live in migrations (consistent with `model_visibility` pattern from STEP-0)
- `data.source.ts` and `app.module.ts` not modified — entity glob `entities/**/*.entity.ts` picks up new files automatically


## STEP-2 SUMMARY

### Type extension — `server/src/types/index.d.ts`
- Added `orgMember?: OrgMemberEntity | null` to `Express.Request` so `OrgMemberGuard` can attach the resolved member to the request and controller handlers can read it

### Entity patch — `server/src/database/entities/organizations/org-member.entity.ts`
- Added `OrgMemberRoleWeights` constant `{ owner:3, admin:2, editor:1, viewer:0 }` for hierarchical role comparison in the guard and service

### DTOs — `server/src/modules/organizations/dto/`
- **`organization.create.request.dto.ts`** — `name` (@MaxLength(100)), `slug` (@Matches(/^[a-z0-9-]+$/), @MaxLength(50))
- **`organization.update.request.dto.ts`** — `name?` optional
- **`organization.response.dto.ts`** — `id`, `name`, `slug`, `planType`, `createdAt`; inline `OrgSubscriptionSummaryDto` (storageLimitBytes, seatsLimit, storageBackend) nested as `subscription?`
- **`org-member.response.dto.ts`** — `userId`, `email`, `firstName?`, `lastName?`, `role`, `joinedAt`
- **`org-invite.create.request.dto.ts`** — `email` (@IsEmail), `role` (@IsEnum(OrgMemberRole))
- **`org-member-role.change.request.dto.ts`** — `role` (@IsEnum(OrgMemberRole))

### Repositories — `server/src/modules/organizations/repositories/`
- **`organization.repository.ts`** — thin wrapper; no custom methods
- **`org-member.repository.ts`** — adds `findByOrgAndUser(orgId, userId)` and `countByOrg(orgId)`
- **`org-invite.repository.ts`** — adds `findActiveByToken(token)` (WHERE accepted_at IS NULL AND expires_at > NOW())

### Mapper — `server/src/modules/organizations/mappers/organization.mapper.ts`
- `toResponse(org, subscription?)` → `OrganizationResponseDto`
- `toMemberResponse(member)` → `OrgMemberResponseDto` (requires `.user` relation loaded)

### Guard + Decorator — `server/src/modules/organizations/guards/`
- **`org-member-role.decorator.ts`** — `@OrgMemberRole(...roles)` via `applyDecorators(SetMetadata(ORG_MEMBER_ROLE_KEY, roles), UseGuards(OrgMemberGuard))`
- **`org-member.guard.ts`** — extracts `orgId` from `request.params.id`, queries membership, checks `OrgMemberRoleWeights` hierarchy, attaches member to `request.orgMember`; 403 if not a member or insufficient role

### Service — `server/src/modules/organizations/services/organization.service.ts`
- `createOrganization(user, dto)` — slug uniqueness check (409); transaction: saves `OrganizationEntity` + `OrgSubscriptionEntity` (50 GiB / 10 seats / local) + `OrgMemberEntity` (owner)
- `getCurrentUserOrganizations(user)` — finds OrgMember rows by userId, loads subscriptions in bulk
- `getOrganization(orgId, user)` — verifies membership (403) before returning org + subscription
- `updateOrganization(orgId, dto)` — merge + save; role check done by guard
- `getMembers(orgId, pagination)` — paginated `OrgMember` JOIN user; returns `PaginationResponseDto<OrgMemberResponseDto>`
- `inviteMember(orgId, dto)` — seats quota check; duplicate member check; creates `OrgInviteEntity` (token = uuid(), expiresAt = +7d); fires invite email via `NotificationsService` (non-blocking)
- `acceptInvite(token)` — `findActiveByToken` or 422; find user by email or 422; transaction: create member + set invite.acceptedAt
- `changeMemberRole(orgId, actorMember, targetUserId, role)` — cannot change owner; cannot target self; actor weight must exceed assigned role weight
- `removeMember(orgId, actorUser, targetUserId)` — owner is protected; self-removal allowed; otherwise actor must be ≥ admin; soft-delete via `softDelete()`

### Controller — `server/src/modules/organizations/controllers/organization.controller.ts`
- Prefix: `/organizations`; `@ApiTags('organizations')`
- Route `/invite/accept` (POST, @Public) declared **before** `/:id` to prevent Express from treating "invite" as an org UUID param
- Routes using `@OrgMemberRole` get both JWT auth (from `JwtAuthGuard` global) and membership + role check (from `OrgMemberGuard` applied by the decorator)
- `changeMemberRole` reads `req.orgMember` (set by guard) as the actor; `removeMember` uses `@Roles([User])` + manual actor check in service to allow self-removal

### Module — `server/src/modules/organizations/organizations.module.ts`
- `TypeOrmModule.forFeature([4 entities])` + `UserModule` imported
- Provides: 3 repositories + `OrganizationService` + `OrgMemberGuard`
- Exports: `OrganizationService`, `OrgMemberRepository` (consumed by future Workspaces module)

### App registration — `server/src/app.module.ts`
- Added `OrganizationsModule` to imports

### Verification
- `npm run lint` — 0 errors, 0 warnings
- `npm run build` — 0 errors

### Decisions
- `storageLimitBytes` stored and passed as bigint string (`"53687091200"`) — PostgreSQL `bigint` ↔ TypeScript `string` via TypeORM
- `NotificationsModule` is `@Global()` — not re-imported in `OrganizationsModule`
- Invite email is sent fire-and-forget (`.catch()` only logs) — transient email failure should not fail the invite creation
- `inviteMember` stores duplicate-email check result but does **not** block on non-registered emails (the invite row is created; `acceptInvite` will reject with 422 if the user hasn't registered yet)


## STEP-3 SUMMARY

### New module — `server/src/modules/workspaces/`

**DTOs** (`dto/`)
- **`workspace.create.request.dto.ts`** — `name` (@IsNotEmpty, @MaxLength(100)), `orgId` (@IsUUID)
- **`workspace.update.request.dto.ts`** — `name?` optional
- **`workspace.response.dto.ts`** — `id`, `name`, `orgId`, `memberCount`, `createdAt`
- **`workspace-member.add.request.dto.ts`** — `userId` (@IsUUID), `role` (@IsEnum(WorkspaceMemberRole))

**Repositories** (`repositories/`)
- **`workspace.repository.ts`** — thin wrapper extending `Repository<WorkspaceEntity>`
- **`workspace-member.repository.ts`** — adds `findByWorkspaceAndUser(workspaceId, userId)` and `countByWorkspace(workspaceId)`

**Mapper** (`mappers/workspace.mapper.ts`)
- Static `toResponse(workspace, memberCount = 0): WorkspaceResponseDto`

**Service** (`services/workspace.service.ts`)
- Injects `WorkspaceRepository`, `WorkspaceMemberRepository`, `OrgMemberRepository` (from `OrganizationsModule`)
- `createWorkspace` — org admin check; transaction saves workspace + creator as `editor` member
- `getMyWorkspaces` — finds all memberships for user, optional `orgId` filter
- `getWorkspace` — workspace membership check (403), count members
- `updateWorkspace` — org admin check
- `deleteWorkspace` — org admin check, soft-delete
- `addMember` — actor must be org admin or workspace editor; target must be org member; no duplicate check
- `removeMember` — self-leave allowed; otherwise org admin required; soft-delete
- `requireOrgAdmin()` — private helper for repeated role check

**Controller** (`controllers/workspace.controller.ts`)
- Prefix `/workspaces`; all 7 routes use `@Roles([UserRoles.User])` + `ParseUUIDPipe`
- No custom guard — all access control lives in service

**Module** (`workspaces.module.ts`)
- `TypeOrmModule.forFeature([WorkspaceEntity, WorkspaceMemberEntity])` + `OrganizationsModule`
- Exports: `WorkspaceService`, `WorkspaceMemberRepository`

### Model3d extension

**`server/src/database/entities/models-3d/model-3d.entity.ts`**
- Added `workspaceId?: string` raw UUID column (`workspace_id`, nullable) — no `@ManyToOne` to avoid circular module dependency

**`server/src/modules/models-3d/dto/models-3d.request.dto.ts`**
- Added `workspaceId?: string` (@IsOptional, @IsUUID) filter field

**Migration** `server/src/database/migrations/models-3d/1776862730000-AddWorkspaceId.ts`
- `up()`: `ALTER TABLE "model_3d"."model_3d" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`
- `down()`: `DROP COLUMN IF EXISTS "workspace_id";`

**`server/src/modules/models-3d/services/model-3d.service.ts`**
- Injected `WorkspaceMemberRepository`
- `find3DModels()` extended: if `workspaceId` present in filters, scopes query to that workspace; skips visibility filter for confirmed workspace members; non-members still see only `public` models

**`server/src/modules/models-3d/models-3d.module.ts`**
- Added `WorkspacesModule` to imports (provides `WorkspaceMemberRepository`)

### App registration
- Added `WorkspacesModule` to `src/app.module.ts` imports

### Verification
- `npm run lint` — 0 errors, 0 warnings
- `npm run build` — 0 errors

### Decisions
- No `OrgMemberGuard`-style custom guard for workspaces — access control in service (workspace access depends simultaneously on workspace membership AND org-level role)
- `workspaceId` in `model-3d.entity.ts` is a raw UUID column — no `@ManyToOne` keeps module graph acyclic
- No cascade on workspace deletion for models — orphaned models are a known MVP limitation (per STEP-3 spec)
- `WorkspacesModule` NOT `@Global()` — explicit import in `Models3dModule`


## STEP-4 SUMMARY

### API Layer

Added 4 new cache tags: Organization, OrgMembers, Workspaces, Workspace to tags.ts.
Added Organizations and Workspaces URL constants to urls.ts.
Appended org/workspace DTOs (enums + interfaces) to dto.ts.

New client/src/app/api/organizations.ts - OrganizationsApi with 9 endpoints: createOrganization, myOrganizations, organization, updateOrganization, orgMembers, inviteOrgMember, acceptOrgInvite, changeOrgMemberRole, removeOrgMember.

New client/src/app/api/workspaces.ts - WorkspacesApi with 7 endpoints: createWorkspace, myWorkspaces, workspace, updateWorkspace, deleteWorkspace, addWorkspaceMember, removeWorkspaceMember.

### Redux Slice

New client/src/entities/organization/model.ts - orgSlice with state { currentOrgId, currentWorkspaceId }, actions setCurrentOrg (resets workspaceId), setCurrentWorkspace, clearOrg. Wrapped with persistReducer key '@mesh_hub/org'.
New client/src/entities/organization/selectors.ts - currentOrgIdSelector, currentWorkspaceIdSelector.
New client/src/entities/organization/index.ts - re-exports model + selectors.
client/src/app/store/index.ts - Added org: orgReducer to reducer map.

### Routing

client/src/shared/router/paths.ts - Added Org, OrgId, OrgCreate, WorkspaceId, WorkspaceSeg path constants.
client/src/app/router/index.tsx - Added lazy routes: org/create -> OrgCreatePage, org/:orgId -> OrgDashboardPage inside BasePage children.

### Pages

New client/src/pages/OrgCreate/OrgCreate.tsx - Form with name + slug fields. Inline slugify on name change. On success dispatches setCurrentOrg, navigates to /org/:id.
New client/src/pages/OrgDashboard/OrgDashboard.tsx - Mantine Tabs: Members tab (table + invite modal + role/remove kebab menus) and Workspaces tab (card grid + create modal). Header shows org name, plan badge, QuotaBar. Storage used is 0 pending STEP-7.

### Widgets

New client/src/widgets/QuotaBar/QuotaBar.tsx - Props: { used, limit, unit?, label? }. null limit shows "Без ограничений". Progress color: green <60%, yellow 60-80%, red >=80%.
New client/src/widgets/OrgSwitcher/OrgSwitcher.tsx - Mantine Menu showing current org name. Switches org via setCurrentOrg + navigate. Shows workspaces for current org via setCurrentWorkspace.
client/src/widgets/Header/index.tsx - Added {session && <OrgSwitcher />} between ColorSchemeSelect and User/AuthButtons.

### Verification
- npm run tscheck - 0 errors
- npm run lint - 0 errors (1 pre-existing warning in Model3DViewer/context.tsx, unrelated)

### Decisions
- storageLimitBytes from server is a bigint string - converted with Number() for QuotaBar (safe for MVP values)
- No dedicated invite-accept page in STEP-4 - acceptOrgInvite API endpoint is wired; page is a future step
- Workspace inner page (/org/:orgId/workspace/:workspaceId) is not implemented - OrgDashboard links to it; page is a future step
- Storage used bytes hardcoded to 0 until STEP-7 (StorageQuotaModule) provides real usage data


## STEP-5 SUMMARY

### Dependency

- `adm-zip` added to `server/package.json` (production); `@types/adm-zip` as devDependency.

### Type layer — `server/src/modules/files/types.ts`
- New `ExtractedFile` interface: `{ relativePath: string; buffer: Buffer }`.
- Added `save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<string>` to `IFileStorageStrategy`.

### FS strategy — `server/src/modules/files/strategies/fs.files.strategy.ts`
- Implemented `save3DModelDirectory`: path-traversal check (each resolved path must start with `modelDir + sep`), creates subdirectories recursively via `mkdir({ recursive: true })`, writes each file via `writeFile`, returns the relative path of the first `.gltf`/`.glb` entry (throws `BadRequestException` if none found).

### Entity — `server/src/database/entities/models-3d/model-3d-file.entity.ts`
- Added `@Column({ type: 'text', nullable: true, name: 'entry_file' }) entryFile?: string`.
- Null for native `.glb`/`.gltf` uploads; stores e.g. `'scene.gltf'` for ZIP-extracted models.

### Migration — `server/src/database/migrations/models-3d/1745345000000-AddEntryFile.ts`
- `up()`: `ALTER TABLE "model_3d"."model_3d_file" ADD COLUMN "entry_file" text`
- `down()`: `DROP COLUMN "entry_file"`

### Constants — `server/src/constants/files.ts`
- Added `'.zip'` to `ACCEPTED_3D_MODEL_FILE_TYPES`.

### Files service — `server/src/modules/files/files.service.ts`
- Added `save3DModelDirectory` delegation method.
- Added `extractAndSave3DModelDirectory(modelId, zipFile)`:
  - Parses ZIP via `AdmZip(zipFile.path)`.
  - Guards: depth ≤ 1 per entry; allowed extensions only (`.gltf .glb .bin .png .jpg .jpeg .webp .ktx2 .mp3 .ogg .wav`); total uncompressed size ≤ 3 GB; exactly one `.gltf`/`.glb` entry point.
  - Delegates to `strategy.save3DModelDirectory`.

### Model3d service — `server/src/modules/models-3d/services/model-3d.service.ts`
- `upload3DModel`: branching after `savedModel` is created.
  - ZIP branch: `extractAndSave3DModelDirectory` → stores `entryFile` on `createdFileEntity` → deletes temp ZIP file via `deleteFile(file.path)`.
  - Non-ZIP branch: existing `save3DModel` call unchanged.

### DTO — `server/src/modules/models-3d/dto/model-3d-file.response.dto.ts`
- Added `@ApiPropertyOptional() entryFile?: string`.

### Mapper — `server/src/modules/models-3d/mappers/model-3d-file.mapper.ts`
- Added `entryFile: entity.entryFile ?? entity.name` (fallback to `name` for native uploads so the client always has a usable value).

### Controller — `server/src/modules/models-3d/controllers/model-3d.controller.ts`
- Changed file-serving route from `@Get('files/:modelId/:fileName')` to `@Get('files/:modelId/*')` and parameter from `@Param('fileName')` to `@Param('0')`.
- Enables serving assets at subdirectory paths (e.g. `GET /models-3d/files/<modelId>/textures/albedo.png`).
- Existing `safeResolvePath` guard remains in place; no path traversal risk introduced.

### Verification
- `npm run build` — 0 errors
- `npm run lint` — 0 errors, 0 warnings
- `npm run migration:run` — `AddEntryFile1745345000000` applied successfully

### Decisions
- `adm-zip` loads ZIP fully into memory — acceptable because Multer's `FileSizeValidator` already rejects uploads > 3 GB before the service is called.
- Temp ZIP file is deleted after successful extraction (inside the transaction block, after all DB saves succeed).
- On any error in `upload3DModel`, existing cleanup logic (`delete3DModel(savedModelId)` or `deleteFile(file.path)`) covers both ZIP and non-ZIP cases.
- Wildcard route fix was not in STEP-0 as described in the plan spec — the real code used `:fileName` which cannot capture `/`-containing paths; fixed here.


## STEP-6 SUMMARY

### Constants — `client/src/shared/constants/files.ts`
- Added `'.zip'` to `ACCEPTED_3D_MODEL_FILE_TYPES`. Validation in `validate3DModelFile.ts` uses this constant directly — no separate change needed.

### DTOs — `client/src/app/api/dto.ts`
- Added `entryFile: string` field to `Model3DFileResponseDto`. The mapper on the server side always populates this field (fallback to `name` for native uploads), so the field is non-optional.

### Upload modal — `client/src/widgets/Upload3DModelModal/index.tsx`
- Added a third line to the dropzone hint text: *"ZIP-архив должен содержать ровно один .gltf или .glb файл."*

### Viewer — `client/src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`
- `loadModel()`: changed `getModel3DFileSrc(modelData.id, modelData.file.name)` → `getModel3DFileSrc(modelData.id, modelData.file.entryFile)`. GLTFLoader resolves relative texture/buffer paths against the base URL of the `.gltf` automatically — no further changes needed.

### Download links — 2 call sites
- `client/src/pages/Models3D/.../Controls/index.tsx` — changed `model.file.name` → `model.file.entryFile`.
- `client/src/pages/Models3D/.../DownloadButton/index.tsx` — same change.

### Verification
- `npm run tscheck` — 0 errors


## STEP-7 SUMMARY

### StorageQuotaModule — `server/src/modules/storage-quota/`
- New `StorageQuotaService` uses `@InjectDataSource() DataSource` (no circular deps with OrganizationsModule or Models3dModule).
- `getStorageUsed(orgId)` — raw SQL SUM of `model_3d_file.size` joining through `model_3d` → workspace WHERE `org_id = $1` AND `deleted_at IS NULL`.
- `getSubscription(orgId)` — loads `OrgSubscriptionEntity` via `dataSource.getRepository`.
- `checkStorageQuota(orgId)` — throws 402 if `storageUsedBytes >= storageLimitBytes` (null = unlimited).
- `checkSeatsQuota(orgId)` — counts active `OrgMemberEntity` rows; throws 402 if count >= `seatsLimit`.
- `checkStorageQuotaByWorkspace(workspaceId)` — resolves workspace → orgId then calls `checkStorageQuota`.

### Upload integration
- `UploadModel3dRequestDto` adds optional `workspaceId: string` (`@IsOptional @IsUUID`).
- `Model3dController.upload3DModel` passes `workspaceId` from body to service.
- `Model3dService.upload3DModel` calls `checkStorageQuotaByWorkspace(workspaceId)` before the transaction when workspaceId provided.
- Frontend `useUpload3DModal` appends `workspaceId` from Redux to FormData when available.

### GET subscription endpoint
- `GET /organizations/:id/subscription` (OrgMemberRole ≥ Viewer) returns `OrgSubscriptionDetailDto`: `planType`, `storageLimitBytes`, `seatsLimit`, `storageBackend`, `storageUsedBytes`.
- `OrganizationsModule` imports `StorageQuotaModule`.
- Frontend `getOrgSubscription` RTK Query endpoint added; `OrgDashboard` uses `subscriptionDetail.storageUsedBytes` for the `QuotaBar` (real data, no longer hardcoded 0).

### Key decisions
- `AppHttpException` constructor is `(message: string, status: HttpStatus)` — message first.
- `OrgSubscriptionEntity.orgId` is a direct UUID column — query with `{ where: { orgId } }` not via relation.


## STEP-8 SUMMARY

### AWS SDK
- Installed `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner` in `server/`.

### Encryption utility — `server/src/utils/encryption.ts`
- `encryptAes256(plaintext, keyHex)` — AES-256-CBC, returns `<ivHex>:<ciphertextHex>`.
- `decryptAes256(ciphertext, keyHex)` — inverse.
- Key stored in `STORAGE_ENCRYPTION_KEY` env var (32-byte hex); accessed via `ConfigService.storageEncryptionKey`.

### IFileStorageStrategy updates — `server/src/modules/files/types.ts`
- Added `S3StorageConfig` interface: `{ region, bucket, accessKeyId, secretAccessKey, endpoint? }`.
- Added `getFileUrl(relativePath): Promise<string | null>` to `IFileStorageStrategy`.
- `FsFileStorageStrategy.getFileUrl` returns `null` (file served locally).

### S3FileStorageStrategy — `server/src/modules/files/strategies/s3.files.strategy.ts`
- Plain class (not NestJS provider), instantiated per-request inside `getStrategyForOrg()`.
- `saveAvatar` / `removeAvatar` → `PutObjectCommand` / `DeleteObjectCommand` under `avatars/` prefix.
- `save3DModel` → streaming `Upload` from `@aws-sdk/lib-storage` under `models-3d/<id>/`.
- `save3DModelDirectory` → parallel `PutObjectCommand` for each `ExtractedFile`.
- `save3DModelThumbnailFromBase64` → base64 decode → `PutObjectCommand`.
- `delete3DModel` → paginated `ListObjectsV2Command` + `DeleteObjectsCommand`.
- `getFileUrl` → `getSignedUrl(GetObjectCommand, { expiresIn: 3600 })`.
- Custom endpoint support (`forcePathStyle: true`) for MinIO/S3-compatible backends.

### FilesService — `server/src/modules/files/files.service.ts`
- Renamed `this.strategy` → `this.localStrategy`.
- Added `@InjectDataSource() DataSource` injection.
- Added `getStrategyForOrg(orgId)` — loads `OrgSubscriptionEntity`; if `storageBackend === S3` and `storageConfigEncrypted` present, decrypts config and returns `new S3FileStorageStrategy(config)`; otherwise returns `this.localStrategy`.

### File serving redirect — `GET /models-3d/files/:modelId/*`
- Endpoint is now `async`; injects `@Res({ passthrough: true }) res: Response`.
- Loads model entity (`Model3dService.getModel`) to check `workspaceId`.
- If workspace present → `getStrategyForOrg(workspace.orgId)` → `strategy.getFileUrl(...)` → `res.redirect(307, url)` for S3.
- Falls back to local `StreamableFile(createReadStream(...))` when strategy returns `null`.

### Admin S3 config endpoint
- `PATCH /organizations/:id/subscription/storage` (OrgMemberRole = Owner).
- Body: `UpdateStorageConfigRequestDto` with `storageBackend: StorageBackend` and optional `s3Config: S3StorageConfigInputDto`.
- S3 credentials are encrypted with AES-256-CBC before storage in `org_subscription.storage_config_encrypted`.
- `OrganizationService.updateStorageConfig` saves new backend + encrypted config.

### Frontend S3 config UI
- `dto.ts`: added `S3StorageConfigDto` and `UpdateStorageConfigRequestDto`.
- `organizations.ts`: added `updateOrgStorageConfig` mutation invalidating `ApiTags.OrgSubscription`.
- `OrgDashboard`: new "Хранилище" tab visible to Owner only; `Select` for backend type; S3 credential fields shown when S3 selected; Save button calls `updateOrgStorageConfig` mutation.
