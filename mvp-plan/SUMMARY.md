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
| STEP-9 | 3 | API Keys + Embed Entities | DONE | |
| STEP-10 | 3 | Embed Module Backend | DONE | |
| STEP-11 | 3 | Embed Frontend | DONE | |
| STEP-12 | 4 | Reviews + Annotations Backend | DONE | |
| STEP-13 | 4 | Reviews Frontend + Viewer Extensions | DONE | |
| STEP-14 | 5 | Versions (Full Stack) | DONE | |
| STEP-15 | 6 | Scenes Backend | DONE | |
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
| STEP-9 | 2026-04-23 | embed schema + 4 entities (ApiKey, EmbedProject, EmbedDomainWhitelist, ModelViewLog), InitEmbed migration, full api-keys module with ApiKeyGuard |
| STEP-10 | 2026-04-23 | Full embed module — EmbedProject CRUD, domain whitelist management, public viewer endpoint with ApiKeyGuard + origin validation, fire-and-forget view logging, 30-day analytics |
| STEP-11 | 2026-04-23 | Embed frontend — logo upload backend (FsStrategy + S3Strategy + FilesService + EmbedService), embed API layer (embed.ts + dto.ts + tags + urls), EmbedViewer standalone page, EmbedProject management page (domains/branding/analytics), OrgDashboard Embed tab, @mantine/charts for analytics chart |
| STEP-12 | 2026-04-23 | 2 entities + migration in model_3d schema; ReviewsModule (4 CRUD endpoints); AnnotationsModule (5 endpoints incl. reorder); workspace-level access control |
| STEP-13 | 2026-04-23 | ReviewPanel + AnnotationManager widgets; viewer modes + raycasting + markers + flyTo; Editor + Model3D page integration |
| STEP-14 | 2026-04-23 | ModelVersionEntity + migration, file storage extensions, VersionsModule backend, VersionHistory widget, Editor/Model3DPage integration, useViewer versionId support |

## Known Issues / Decisions Made

| Date | Decision |
|---|---|
| 2026-04-22 | FS directories keyed by `modelId`, not `fileEntityId` (see STEP-0) |
| 2026-04-22 | `SceneEntity.workspaceId` is NOT NULL — no personal scenes on MVP |
| 2026-04-22 | `WorkspaceMember.role` enum: `editor \| viewer` (owner/admin only at org level) |
| 2026-04-22 | `EmbedProject` has no FK to `ApiKey` — any org key authorizes embed requests |
| 2026-04-22 | `StorageQuotaModule` is a standalone module imported by both Orgs and Models3d |
| 2026-04-22 | Embed iframe postMessage validates `event.origin` against domain whitelist |
| 2026-04-23 | Annotation writes on personal models (no workspaceId) fall back to model-owner check instead of workspace membership |
| 2026-04-23 | No pagination for comments on MVP — flat list returned (expected < 100 per model) |


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


## STEP-9 SUMMARY

### Constants — `server/src/database/constants.ts`
- Added `Embed: 'embed'` to `DatabaseSchemas` — `init/index.ts` iterates this map, so the schema is created automatically on next `db:init` run.
- Added `EmbedSchemaTables = { ApiKey, EmbedProject, EmbedDomainWhitelist, ModelViewLog }`.

### Entities — `server/src/database/entities/embed/`
- **`api-key.entity.ts`** — `GuidIdEntityBase`; columns: `name`, `prefix varchar(8)` (unique index), `keyHash text` (unique index), `lastUsedAt?`, `expiresAt?`, `revokedAt?`; ManyToOne → `OrganizationEntity`
- **`embed-project.entity.ts`** — `GuidIdEntityBase`; columns: `name`, `brandingConfig json?`, `autoRotate boolean`; ManyToOne → `OrganizationEntity`; ManyToOne nullable → `Model3dEntity` (SET NULL on delete); exports `BrandingConfig` interface
- **`embed-domain-whitelist.entity.ts`** — `IntIdBaseEntity`; column: `domain`; ManyToOne → `EmbedProjectEntity` (CASCADE); `@Index` on `embed_project_id`
- **`model-view-log.entity.ts`** — `IntIdBaseEntity`; columns: `origin?`, `durationSeconds? int`; ManyToOne → `Model3dEntity` (CASCADE); ManyToOne nullable → `EmbedProjectEntity` (SET NULL)

### Migration — `server/src/database/migrations/embed/1745370000000-InitEmbed.ts`
- Creates 4 tables: `api_key`, `embed_project`, `embed_domain_whitelist`, `model_view_log`
- FK constraints: `api_key.org_id → organizations.organization`, `embed_project.org_id → organizations.organization`, `embed_project.model_id → model_3d.model_3d` (SET NULL), `embed_domain_whitelist.embed_project_id → embed_project` (CASCADE), `model_view_log.model_id → model_3d.model_3d` (CASCADE), `model_view_log.embed_project_id → embed_project` (SET NULL)
- Unique constraints: `api_key.prefix`, `api_key.key_hash`
- Indexes: `IDX_embed_domain_whitelist_project_id`, composite `IDX_model_view_log_embed_project_created` on `(embed_project_id, created_at DESC)`
- `down()` drops indexes → FKs → tables in dependency order

### `api-keys` Module — `server/src/modules/api-keys/`
- **`dto/api-key.create.request.dto.ts`** — `orgId` (@IsUUID), `name` (@IsNotEmpty, @MaxLength(100))
- **`dto/api-key.response.dto.ts`** — `id`, `name`, `prefix`, `lastUsedAt?`, `expiresAt?`, `revokedAt?`, `rawKey?` (present only in create response)
- **`repositories/api-key.repository.ts`** — `findByHash(keyHash)` (loads org relation) + `findByOrg(orgId)`
- **`mappers/api-key.mapper.ts`** — static `toResponse(entity, rawKey?)`; never exposes `keyHash`
- **`services/api-key.service.ts`** — `generate`: 32 random bytes → base64url, prefix = first 8 chars, rawKey = `prefix_random`, keyHash = SHA256(rawKey) hex, save, return with rawKey (shown once); `list`: findByOrg without rawKey; `revoke`: set revokedAt = now()
- **`guards/api-key.guard.ts`** — reads `X-Api-Key` header → SHA256 → `findByHash` → checks (found, not revoked, not expired) → `request.apiKey = entity`; `lastUsedAt` update is fire-and-forget; identical `UnauthorizedException` for all failure cases (no timing leak)
- **`controllers/api-key.controller.ts`** — prefix `/api-keys`; POST `/` → 201; GET `/?orgId=` → 200; DELETE `/:id?orgId=` → 200
- **`api-keys.module.ts`** — `forFeature([ApiKeyEntity])`; exports `ApiKeyGuard`, `ApiKeyRepository` for use in STEP-10

### Cross-cutting changes
- **`server/src/app.module.ts`** — added `ApiKeysModule` import
- **`server/src/types/index.d.ts`** — added `apiKey?: ApiKeyEntity | null` to `Express.Request`
- **`server/src/modules/files/files.service.ts`** — fixed pre-existing bug: `this.strategy` → `this.localStrategy` in `extractAndSave3DModelDirectory()`

### Verification
- `npm run build` — 0 errors
- `npm run lint` — 0 errors in STEP-9 files (remaining errors are pre-existing in STEP-8 files)


## STEP-10 SUMMARY

### Entity patch — `server/src/database/entities/embed/embed-project.entity.ts`
- Added `@OneToMany(() => EmbedDomainWhitelistEntity, (d) => d.embedProject) domains: EmbedDomainWhitelistEntity[]` relation (no cascade — whitelist entries managed independently)
- Import changed from `{ Column, Entity, JoinColumn, ManyToOne }` to include `OneToMany`

### DTOs — `server/src/modules/embed/dto/`
- **`embed-project.create.request.dto.ts`** — `orgId` (@IsUUID), `name` (@IsNotEmpty, @MaxLength(100)), `modelId?` (@IsUUID, @IsOptional), `autoRotate?` (@IsBoolean, @IsOptional)
- **`embed-project.update.request.dto.ts`** — all fields optional; includes nested `BrandingConfigDto` with `logoUrl?` (@IsUrl), `primaryColor?` (@Matches `#RRGGBB`), `showBadge` (@IsBoolean); validated with `@ValidateNested` + `@Type`
- **`embed-project.response.dto.ts`** — `id, orgId, name, modelId, autoRotate, brandingConfig, allowedOrigins: string[], createdAt, updatedAt?`; `allowedOrigins` is derived from loaded `domains` relation
- **`embed-viewer.response.dto.ts`** — `model: Model3dResponseDto, brandingConfig, autoRotate, allowedOrigins`; used by the public endpoint
- **`view-analytics.response.dto.ts`** — `dailyViews: { date: string, count: number }[]`, `topOrigins: { origin: string, count: number }[]`, `totalViews: number`
- **`domain.add.request.dto.ts`** — `domain` with `@Matches` regex enforcing hostname-only (no protocol, no path, optional port)

### Repositories — `server/src/modules/embed/repositories/`
- **`embed-project.repository.ts`** — `findByModel(modelId)` (with `domains` relation, newest first), `findByOrg(orgId)`, `findById(id)`; all load `domains` relation
- **`embed-domain-whitelist.repository.ts`** — `hardDeleteByProjectAndDomain(projectId, domain)` — hard delete via QueryBuilder (no soft-delete for whitelist entries)
- **`model-view-log.repository.ts`** — `createLog(projectId, modelId, origin?)` (fire-and-forget, errors only logged); `getDailyViews(projectId, days)` via raw QueryBuilder using `TO_CHAR(DATE(...), 'YYYY-MM-DD')`; `getTopOrigins(projectId, limit)` GROUP BY origin; `getTotalViews(projectId)` via `count()`

### Mapper — `server/src/modules/embed/mappers/embed.mapper.ts`
- Static class (not a NestJS provider): `toProjectResponse(project)`, `toViewerResponse(model, project)`, `toAnalyticsResponse(daily, origins, total)`
- Raw SQL count strings cast to `Number()` in analytics methods

### Service — `server/src/modules/embed/services/embed.service.ts`
- Injects: `EmbedProjectRepository`, `EmbedDomainWhitelistRepository`, `ModelViewLogRepository`, `Model3dService`, `OrgMemberRepository`
- **`getEmbedViewer`**: project lookup by modelId → 404; org mismatch with API key → 403; if Origin header present: `new URL(origin).hostname` extracted, empty whitelist → 403, hostname not found → 403; model loaded via `Model3dService.get3DModel`; view log written fire-and-forget
- **`createProject`**, **`listProjects`**, **`updateProject`**: org membership checked via private `requireMembership(orgId, userId, minRole)` using `OrgMemberRoleWeights`
- **`addDomain`** / **`removeDomain`**: membership ≥ editor required; add saves `EmbedDomainWhitelistEntity`; remove calls `hardDeleteByProjectAndDomain`
- **`getAnalytics`**: membership ≥ viewer; 3 queries run concurrently with `Promise.all`

### Controller — `server/src/modules/embed/controllers/embed.controller.ts`
- Prefix `/embed`; `@ApiTags('embed')`
- Route declaration order (critical for Express): all `/projects/*` routes declared **before** `/:modelId` to prevent "projects" being treated as a modelId UUID
- `GET /:modelId` decorated with `@Public()` + `@UseGuards(ApiKeyGuard)`; `Request` imported as `import type` (required for `isolatedModules` + `emitDecoratorMetadata`)
- `DELETE /projects/:id/domains/:domain` returns `@HttpCode(204)` (no body)

### Module — `server/src/modules/embed/embed.module.ts`
- `TypeOrmModule.forFeature([EmbedProjectEntity, EmbedDomainWhitelistEntity, ModelViewLogEntity])`
- Imports: `ApiKeysModule` (provides `ApiKeyGuard` via DI), `Models3dModule` (provides `Model3dService`), `OrganizationsModule` (provides `OrgMemberRepository`)

### App registration — `server/src/app.module.ts`
- Added `EmbedModule` import

### Verification
- `npm run build` — 0 errors
- `npm run lint` — 0 errors, 0 warnings

### Decisions
- Origin absent (server-side / Postman calls) → domain check skipped entirely — only browser-originated requests with an `Origin` header are validated
- Empty domain whitelist = reject all origins — operator must configure at least one domain before the embed endpoint works in a browser
- ApiKey authorization is org-scoped only — any active key for the org authorizes any embed project in that org (no key-to-project binding on MVP)
- `updateProject` uses `'modelId' in dto` check to allow explicitly setting `modelId: null` (unlink model) vs. omitting the field entirely

## STEP-11 SUMMARY

### Backend — Logo Upload

**`server/src/modules/files/types.ts`**
- Added `saveEmbedLogo(projectId: string, file: Express.Multer.File): Promise<string>` to `IFileStorageStrategy`

**`server/src/modules/config/config.service.ts`**
- Added `embed: resolve(root, 'embed')` to `fsConfig.folders` — initialised automatically by `FsFileStorageStrategy.init()`

**`server/src/modules/files/strategies/fs.files.strategy.ts`**
- Added `saveEmbedLogo()`: creates `files/embed/<projectId>/` directory, writes `logo<ext>`, returns relative path `<projectId>/logo<ext>`
- Added private helper follows same pattern as `getAvatarFilePath`

**`server/src/modules/files/strategies/s3.files.strategy.ts`**
- Added `saveEmbedLogo()`: uploads to S3 key `embed/<projectId>/logo<ext>`, returns key
- Added `import { extname } from 'path'` (was missing in S3 strategy)

**`server/src/modules/files/files.service.ts`**
- Added `saveEmbedLogo(projectId, file)` delegating to `localStrategy` (always local, same as avatars/thumbnails)

**`server/src/modules/embed/services/embed.service.ts`**
- Injected `FilesService`
- Added `uploadProjectLogo(projectId, user, file)`: saves logo, sets `brandingConfig.logoUrl = /api/embed/projects/:id/logo`, saves, re-fetches, maps
- Added `streamProjectLogo(projectId, res)`: reads `files/embed/<projectId>/logo*`, returns `StreamableFile`
- Added `import { createReadStream } from 'fs'`, `import { readdir } from 'fs/promises'`, `import { join } from 'path'`, `import { StreamableFile } from '@nestjs/common'`, `import type { Response } from 'express'`

**`server/src/modules/embed/controllers/embed.controller.ts`**
- Added `POST /projects/:id/logo` — multipart file upload, returns `EmbedProjectResponseDto`
- Added `GET /projects/:id/logo` — `@Public()`, `@Header('Cache-Control', 'max-age=3600')`, returns `StreamableFile`
- Added imports: `FileInterceptor`, `Header`, `Res`, `StreamableFile`, `UploadedFile`, `UseInterceptors`, `ApiBody`, `ApiConsumes`

### Frontend — API Layer

**`client/src/app/api/dto.ts`**
- Added 8 new interfaces: `BrandingConfigDto`, `EmbedProjectResponseDto`, `EmbedProjectCreateRequestDto`, `EmbedProjectUpdateRequestDto`, `EmbedViewerResponseDto`, `DailyViewDto`, `OriginViewDto`, `ViewAnalyticsResponseDto`

**`client/src/app/api/tags.ts`**
- Added `EmbedProjects: 'EmbedProjects'` and `EmbedProject: 'EmbedProject'`

**`client/src/app/api/urls.ts`**
- Added `Embed: 'embed'`

**`client/src/app/api/embed.ts`** (new)
- 8 endpoints: `embedViewer`, `embedProjects`, `createEmbedProject`, `updateEmbedProject`, `addEmbedDomain`, `removeEmbedDomain`, `embedAnalytics`, `uploadEmbedLogo`
- `embedViewer` passes `X-Api-Key` header directly (public endpoint, no cookie auth)

### Frontend — Router

**`client/src/shared/router/paths.ts`**
- Added `Embed`, `EmbedModelId`, `EmbedProjectId`

**`client/src/app/router/index.tsx`**
- Added standalone `embed/:modelId` route → `EmbedViewerPage`
- Added org-scoped `:orgId/embed/:projectId` route inside `BasePage` → `EmbedProjectPage`

### Frontend — Pages

**`client/src/pages/EmbedViewer/`** (new)
- Reads `modelId` from params, `apiKey` from search params
- Calls `useEmbedViewerQuery`, renders `Model3DViewer` full-screen
- Shows "Powered by MeshHub" badge if `brandingConfig.showBadge`
- Error/loading states handled

**`client/src/pages/EmbedProject/`** (new)
- Fetches project from `useEmbedProjectsQuery` (by id filter)
- 3 tabs: Домены (add/remove), Брендинг (logo upload, showBadge, primaryColor), Аналитика (total views + `@mantine/charts` BarChart + top origins)

### Frontend — OrgDashboard

**`client/src/pages/OrgDashboard/OrgDashboard.tsx`**
- Added "Embed" tab with project list (cards navigating to EmbedProject page)
- Added "Создать embed-проект" modal with `useCreateEmbedProjectMutation`

### Dependencies

**`@mantine/charts` + `recharts`**
- Installed for analytics `BarChart` component in EmbedProjectPage

### Verification
- `cd server && npm run build` — 0 errors
- `cd server && npm run lint` — 0 errors, 0 warnings
- `cd client && npm run tscheck` — 0 errors
- `cd client && npx eslint src/pages/EmbedProject/ src/pages/EmbedViewer/ src/app/api/embed.ts src/app/router/index.tsx src/pages/OrgDashboard/OrgDashboard.tsx` — 0 errors

## STEP-12 SUMMARY

### Constants — `server/src/database/constants.ts`
- Added `ModelComment: 'model_comment'` and `ModelAnnotation: 'model_annotation'` to `Models3DSchemaTables`

### Entities — `server/src/database/entities/models-3d/`

**`model-comment.entity.ts`** — `body: text`, `posX/Y/Z: float8 nullable`, `resolved: boolean (default false)`, `parentId: uuid nullable`; relations: `@ManyToOne → Model3dEntity`, `@ManyToOne → UserEntity (eager)`, `@ManyToOne → ModelCommentEntity` (self-ref, nullable); `@Index` on `modelId`

**`model-annotation.entity.ts`** — `label: varchar(50)`, `body: text nullable`, `posX/Y/Z: float8`, `cameraPosX/Y/Z: float8 nullable`, `order: int (default 0)`; relation: `@ManyToOne → Model3dEntity`; `@Index` on `modelId`

### Migration — `server/src/database/migrations/models-3d/1776929000000-AddReviewsAndAnnotations.ts`
- Creates `model_3d.model_comment` with FK → `model_3d`, `users.user`, self-ref `parent_id`; index on `model_id`
- Creates `model_3d.model_annotation` with FK → `model_3d`; index on `model_id`
- `down()` drops in reverse order

### `reviews` Module — `server/src/modules/reviews/`
- **DTOs**: `CommentCreateRequestDto`, `CommentUpdateRequestDto`, `CommentResponseDto`
- **Repository**: `ModelCommentRepository` — `findByModelId()` (loads author+userMeta), `findById()`, `findChildrenOf()`
- **Mapper**: `CommentMapper.toResponse()` — maps `posX/Y/Z` to `pos: {x,y,z}|null`, includes `author` with avatar
- **Service**: `getComments()` / `addComment()` check model visibility — public: open; non-public: requires auth + workspace membership (or model ownership for personal models); `updateComment()` / `deleteComment()` require authorship or workspace `editor` role; delete cascades soft-delete to children
- **Controller**: `GET /models-3d/:modelId/comments` — `@Public()` + `@OptionalUser()`; `POST/PATCH/DELETE` — `@Roles([User])`

### `annotations` Module — `server/src/modules/annotations/`
- **DTOs**: `AnnotationCreateRequestDto`, `AnnotationUpdateRequestDto`, `AnnotationResponseDto`, `AnnotationReorderRequestDto`
- **Repository**: `ModelAnnotationRepository` — `findByModelId()` ordered by `order ASC, createdAt ASC`
- **Service**: `getAnnotations()` — `@Public()`, only existence check (404); write operations require workspace `editor` role (or model ownership on personal models); `reorderAnnotations()` bulk-updates `order` field by array index
- **Controller**: `GET` — `@Public()`; `POST/PATCH/DELETE` — `@Roles([User])`; `PUT /reorder` — `@Roles([User])`

### App Registration
- `ReviewsModule` and `AnnotationsModule` added to `app.module.ts` imports

### Decisions
- `WorkspacesModule` already exported `WorkspaceMemberRepository` — no change needed
- Personal model (no `workspaceId`) annotation/comment writes fall back to model-owner check
- Comments returned as flat list — frontend threads by `parentId`
- No pagination for comments on MVP

### Verification
- `cd server && npm run build` — 0 errors
- `cd server && npm run lint` — 0 errors, 0 warnings


## STEP-13 SUMMARY

### Data Layer

**`client/src/app/api/tags.ts`**
- Added `Comments` and `Annotations` cache tags

**`client/src/app/api/dto.ts`**
- 8 new types: `CommentAuthorDto`, `CommentResponseDto`, `CommentCreateRequestDto`, `CommentUpdateRequestDto`, `AnnotationResponseDto`, `AnnotationCreateRequestDto`, `AnnotationUpdateRequestDto`, `AnnotationReorderRequestDto`

**`client/src/app/api/reviews.ts`** (new file)
- `ReviewsApi` with 9 RTK Query hooks for comments (list, add, update, delete) and annotations (list, create, update, delete, reorder)
- All endpoints use `Api.injectEndpoints({ overrideExisting: true })`; correct cache tag invalidation

### Viewer Extensions

**`client/src/widgets/Model3DViewer/classes/types/viewer.ts`**
- Added `ViewerMode = 'view' | 'comment' | 'annotate'`

**`client/src/widgets/Model3DViewer/classes/Camera/Camera.ts`** (CameraController)
- Added `flyTo(camX, camY, camZ, targetX, targetY, targetZ)` -- delegates to `camera-controls.setLookAt` for animated camera fly

**`client/src/widgets/Model3DViewer/classes/World/World.ts`**
- Added `private markers: Map<string, Mesh>`
- Added `spawnMarker(id, pos)` -- orange (0xffaa00) sphere at world position
- Added `removeMarker(id)`, `clearMarkers()`, `highlightMarker(id|null)` -- 0xff5500 highlight, 0xffaa00 default

**`client/src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`**
- Added `_mode: ViewerMode` + `setMode(mode)` -- updates cursor style; clears old pointer handler on reset to view
- Added `onScenePointerDown(callback)` -- one-shot raycast handler; on mesh hit, fires callback with (worldPos, cameraPos) and auto-resets to view

### Hooks

**`client/src/widgets/Model3DViewer/hooks/useViewerReviews.ts`** (new file)
- Bridge hook: fetches annotations, syncs markers on change via clearMarkers + spawnMarker loop
- Exposes `startPlacement(mode)` -> calls `viewer.setMode` + `viewer.onScenePointerDown`; stores result in `pending: PendingPlacement|null`
- Returns `{ pending, clearPending, startPlacement, annotations }`; consumed by `AnnotationManager`

### Widgets

**`client/src/widgets/ReviewPanel/`** (new widget)
- `ReviewPanel.tsx` -- comment thread panel: place-comment button -> viewer mode -> inline input with pos; renders threaded CommentCard list with reply, resolve, delete actions
- Props: `{ modelId: string, viewer: Viewer | null }`; auth-aware (own comments editable)

**`client/src/widgets/AnnotationManager/`** (new widget)
- `AnnotationManager.tsx` -- annotation CRUD + DnD reorder panel using @dnd-kit/sortable
- Props: `{ modelId: string, viewer: Viewer | null, canEdit: boolean }`; uses `useViewerReviews` for marker sync
- Add annotation -> startPlacement -> Modal for label/body -> createAnnotation; fly-to button -> flyTo + highlightMarker; drag handle for reorderAnnotations; delete button

### Editor Page Integration

- `Navbar/model.ts` -- TabValue extended with `comments | annotations`
- `Navbar/constants.ts` -- TabValues.Comments and TabValues.Annotations added
- `Navbar/utils.tsx` -- getTabsConfig signature changed to (viewer, modelId?); 2 new tabs added
- `Navbar/index.tsx` -- NavbarProps extended with modelId?; useMemo passes modelId to getTabsConfig
- `pages/Editor/index.tsx` -- Navbar now receives modelId={id}

### Model3D Page Integration

**`client/src/pages/Models3D/pages/Model3D/index.tsx`**
- Added `viewer: Viewer | null` state; onReady now calls setViewer
- Two Drawer components (right, size 380): Comments drawer with ReviewPanel; Annotations drawer with AnnotationManager (canEdit={model3d?.isOwner})
- useDisclosure for both drawers

**`client/src/pages/Models3D/pages/Model3D/components/ReviewDrawerButtons/`** (new component)
- Two ActionIcon + Tooltip buttons (Comments / Annotations), overlaid top-right of viewer via position: absolute
- Shown only after viewer finishes loading

### Dependencies
- @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities added to client package.json

### Verification
- npx tsc --noEmit in client/ -- 0 errors


## STEP-14 SUMMARY

### Entity — `server/src/database/entities/models-3d/model-version.entity.ts`
- New `ModelVersionEntity` extends `GuidIdEntityBase`
- Columns: `versionNumber: int`, `fileName: text`, `fileSize: bigint`, `mimeType: text`, `entryFile?: text` (for ZIP versions), `changeNotes?: varchar(500)`, `isActive: boolean (default false)`, `modelId: uuid FK → model_3d`, `uploaderId: uuid FK → users.user`
- Relations: `@ManyToOne → Model3dEntity`, `@ManyToOne → UserEntity` with uploader.userMeta eager load
- `@Index(['modelId'])` on entity class

### Entity patch — `server/src/database/entities/models-3d/model-3d.entity.ts`
- Added `currentVersionId?: string` UUID column (`current_version_id`, nullable)
- Added `@OneToMany(() => ModelVersionEntity) versions?: ModelVersionEntity[]` relation

### DB Constants — `server/src/database/constants.ts`
- Added `ModelVersion: 'model_version'` to `Models3DSchemaTables`

### Migration — `server/src/database/migrations/models-3d/1776930000000-AddModelVersions.ts`
- Creates `model_3d.model_version` table with FKs to `model_3d` (CASCADE) and `users.user` (CASCADE)
- Adds `current_version_id uuid nullable` column to `model_3d.model_3d`
- Backfill: INSERTs v1 rows for all existing models from `model_3d_file` data (isActive=true)
- UPDATEs each model's `current_version_id` to the backfilled v1 row
- `down()` drops column, drops index, drops table

### File Storage Extensions

**`server/src/modules/files/types.ts`** — 4 new methods added to `IFileStorageStrategy`:
- `saveModelVersion(modelId, versionId, file)` — save single file under `versions/<versionId>/`
- `saveModelVersionDirectory(modelId, versionId, files: ExtractedFile[])` — save extracted ZIP; returns entryFile path
- `deleteModelVersion(modelId, versionId)` — remove entire version directory
- `copyVersionToRoot(modelId, versionId, entryFile?)` — copy version files to model root dir

**`server/src/modules/files/strategies/fs.files.strategy.ts`**
- Implemented all 4 methods; private `getVersionDirPath()` helper → `models-3d/<modelId>/versions/<versionId>`
- `saveModelVersion`: `mkdir` + `rename` temp file; `deleteModelVersion`: `rm -rf`; `copyVersionToRoot`: list files + `copyFile` each; `saveModelVersionDirectory`: validate paths + write extracted files

**`server/src/modules/files/strategies/s3.files.strategy.ts`**
- Implemented all 4 methods with S3 equivalents using `PutObjectCommand`, `CopyObjectCommand`, `ListObjectsV2Command`, `DeleteObjectsCommand`

**`server/src/modules/files/files.service.ts`**
- Added 8 new delegation methods (local + org-aware variants for each operation)
- Added `extractAndSaveModelVersionDirectory(modelId, versionId, zipFile, orgId?)` — full ZIP extraction with validation delegating to storage strategy

### `versions` Submodule — `server/src/modules/models-3d/versions/`

**DTOs**
- `version.upload.request.dto.ts` — `changeNotes?` (@IsOptional, @MaxLength(500))
- `version.response.dto.ts` — `VersionUploaderDto` (id, firstName?, lastName?, avatar?); `VersionResponseDto` (id, versionNumber, fileName, fileSize, entryFile?, changeNotes, isActive, uploader, createdAt)

**Repository** (`model-version.repository.ts`)
- `findByModelId(modelId)` — DESC order, loads `uploader.userMeta`
- `findActive(modelId)`, `findById(versionId)`, `findLastVersion(modelId, em?)` (EntityManager-aware for transactions)

**Mapper** (`model-version.mapper.ts`)
- `ModelVersionMapper.toResponse(entity)` → `VersionResponseDto`; `Number()` cast for bigint fileSize

**Service** (`versions.service.ts`)
- `getVersions(modelId, user)` — owner-only check, returns ordered list
- `uploadVersion(modelId, user, file, dto)` — pessimistic write lock on Model3dEntity; computes nextVersion; saves entity in transaction; saves file after (ZIP → extract; else single file); cleans up on error
- `activateVersion(modelId, versionId, user)` — transaction: deactivate all → activate target → update model.file.entryFile + model.currentVersionId; then `copyVersionToRoot`; file copy errors logged but not thrown
- `deleteVersion(modelId, versionId, user)` — rejects active version (400); soft-deletes entity; deletes files

**Controller** (`versions.controller.ts`)
- `GET /models-3d/:modelId/versions` — owner-only
- `POST /models-3d/:modelId/versions` — multipart with `FileSizeValidator(MAX_3D_MODEL_FILE_SIZE)` + `FileExtensionValidatorPipe(['.glb','.gltf','.zip'])`
- `POST /models-3d/:modelId/versions/:versionId/activate`
- `DELETE /models-3d/:modelId/versions/:versionId`

**Module** (`versions.module.ts`)
- `TypeOrmModule.forFeature([ModelVersionEntity])` + providers + exports

### Model3dController — versioned file serving

**`GET /models-3d/files/:modelId/versions/:versionId/*`** added **before** `GET /models-3d/files/:modelId/*` to avoid route shadowing:
- `@Public()`, `@Header('Cache-Control', 'max-age=2592000')`
- S3 redirect via `strategy.getFileUrl('models-3d/<modelId>/versions/<versionId>/<fileName>')`
- FS path: `files/models-3d/<modelId>/versions/<versionId>/<fileName>` with `safeResolvePath` guard

### `Models3dModule` updates
- Added `ModelVersionEntity` to `TypeOrmModule.forFeature([...])`
- Imported `VersionsModule`

### Frontend — Data Layer

**`client/src/app/api/dto.ts`**
- Added `ModelVersionUploaderDto`, `ModelVersionResponseDto`

**`client/src/app/api/tags.ts`**
- Added `ModelVersions: 'ModelVersions'`

**`client/src/app/api/versions.ts`** (new)
- `VersionsApi` with 4 endpoints: `modelVersions`, `uploadVersion`, `activateVersion`, `deleteVersion`
- Exported hooks: `useModelVersionsQuery`, `useUploadVersionMutation`, `useActivateVersionMutation`, `useDeleteVersionMutation`
- `activateVersion` invalidates both `ModelVersions` and `Get3DModel` tags

### Frontend — Shared Utils

**`client/src/shared/utils/model3d.ts`**
- Added `getModel3DVersionFileSrc(modelId, versionId, fileName)` → `/api/models-3d/files/<modelId>/versions/<versionId>/<fileName>`

### Viewer Extension

**`client/src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`**
- Added `loadFile(url: string): Promise<void>` — calls `world.destroy()` to clear scene, then `processLoadedModel(Loader.load(url))`; reuses existing world (Renderer holds reference); no extra spawn needed

### `VersionHistory` Widget — `client/src/widgets/VersionHistory/`

- `index.tsx` — re-exports `VersionHistory`, `VersionHistoryProps`
- `VersionHistory.tsx` — props `{ modelId, canEdit, viewer? }`:
  - Fetches versions via `useModelVersionsQuery`
  - "Upload" button (canEdit) → `UploadVersionModal`
  - Renders `VersionCard` list
- `UploadVersionModal` — FileInput (`.glb,.gltf,.zip`) + Textarea for changeNotes; `useUploadVersionMutation`
- `VersionCard` — shows versionNumber, badge if active, fileName, changeNotes, uploader+date; Preview button (if viewer → `viewer.loadFile()`); Restore button → `useActivateVersionMutation`; Delete button → confirm modal → `useDeleteVersionMutation`

### Model3DPage Integration

**`ReviewDrawerButtons`** — added `onVersions` prop + `IconClockHour4` button

**`Model3DPage`** (`client/src/pages/Models3D/pages/Model3D/index.tsx`)
- Added `versionsOpened` disclosure + `openVersions/closeVersions`
- Added versions Drawer (right, size 400) with `<VersionHistory modelId={id} canEdit={model3d?.isOwner ?? false} viewer={viewer} />`

### Editor Navbar Integration

- `model.ts` — `TabValue` union extended with `'versions'`
- `constants.ts` — `TabValues.Versions = 'versions'` added
- `utils.tsx` — new tab entry with `IconClockHour4` + `<VersionHistory modelId={modelId ?? ''} canEdit viewer={viewer} />`; added `VersionHistory` import

### `useViewer.ts` — `versionId` Query Param Support

- Added `useSearchParams` import
- In `run` effect: reads `searchParams.get('versionId')`
- If `versionId` present: loads `getModel3DVersionFileSrc(model.id, versionId, model.file.entryFile || model.file.name)` via `viewer.loadFile(url)` instead of `viewer.loadModel(model)`
- Dependency array extended: `[viewer, model?.id, searchParams.get('versionId')]`

### Decisions
- Active version cannot be deleted (400) — must activate a different version first
- File copy errors in `activateVersion` are logged but do not roll back the DB transaction — keeps DB consistent even on transient FS/S3 failures
- `fileSize` stored as PostgreSQL `bigint`; mapper uses `Number()` cast (safe for MVP file sizes ≤ 3 GB)
- `loadFile()` does not cache (unlike `loadModel()`) — preview is ephemeral; user can reload the main model via `useViewer` re-run


## STEP-15 SUMMARY

### Database — Schema & Tables

**`server/src/database/constants.ts`**
- Added `Scenes: 'scenes'` to `DatabaseSchemas`
- Added `ScenesSchemaTables = { Scene: 'scene', SceneObject: 'scene_object', SceneLight: 'scene_light' }` constant object

**`server/src/database/entities/scenes/`** (all new)
- `scene-config.type.ts` — plain TS interfaces `SceneCameraBookmark { label, posX/Y/Z, targetX/Y/Z }` and `SceneConfig { backgroundColor, ambientLightIntensity, environmentHdriPath?, cameraBookmarks[] }`
- `scene.entity.ts` — `name: varchar(100)`, `description: text?`, `config: jsonb?`, `thumbnailPath: text?`, `workspaceId: uuid NOT NULL FK → workspaces.workspace (CASCADE)`; OneToMany relations to SceneObjectEntity and SceneLightEntity
- `scene-object.entity.ts` — 9 float columns (posX/Y/Z, rotX/Y/Z, scaleX/Y/Z defaults 0/0/0/0/0/0/1/1/1), `order: int (default 0)`, FK `sceneId → scenes.scene (CASCADE)`, FK `modelId → model_3d.model_3d`; `@Index(['sceneId'])`
- `scene-light.entity.ts` — `type: enum LightType { directional | point | spot }`, `posX/Y/Z: float`, `color: varchar(7) default '#ffffff'`, `intensity: float default 1.0`, `castShadow: boolean default true`, FK `sceneId → scenes.scene (CASCADE)`

**`server/src/database/migrations/scenes/1776940000000-InitScenes.ts`**
- Creates `scenes` schema, `light_type` enum, tables `scene` / `scene_object` / `scene_light` with all FK constraints and index on `scene_object.scene_id`
- `down()` drops index → tables → enum → schema in reverse order
- Migration applied successfully to dev DB

### Plan Limits — `server/src/constants/plan-limits.ts`
- New file: `SCENE_LIMITS` record keyed by `PlanType` (starter/growth/enterprise)
- starter: `{ maxObjects: 3, maxLights: 2, hdriEnabled: false }`
- growth: `{ maxObjects: 15, maxLights: 10, hdriEnabled: true }`
- enterprise: `{ maxObjects: Infinity, maxLights: Infinity, hdriEnabled: true }`

### File Storage Extensions

**`server/src/modules/files/types.ts`** — 2 new methods on `IFileStorageStrategy`:
- `saveSceneHdri(sceneId, file)` — save HDRI file to `scenes/<sceneId>/environment.hdr`
- `deleteSceneFiles(sceneId)` — remove entire `scenes/<sceneId>/` directory/prefix

**`server/src/modules/files/strategies/fs.files.strategy.ts`**
- `saveSceneHdri`: `mkdir` scene dir + `rename` temp file to `environment.hdr`
- `deleteSceneFiles`: `rm -rf scenes/<sceneId>/`
- Private `getSceneDirPath()` helper → `<cwd>/files/scenes/<sceneId>`

**`server/src/modules/files/strategies/s3.files.strategy.ts`**
- `saveSceneHdri`: `PutObjectCommand` uploads to `scenes/<sceneId>/environment.hdr`
- `deleteSceneFiles`: `ListObjectsV2Command` + `DeleteObjectsCommand` bulk-removes `scenes/<sceneId>/` prefix

**`server/src/modules/files/files.service.ts`** — 3 new methods:
- `saveSceneHdri(orgId, sceneId, file)` — delegates to `getStrategyForOrg(orgId)`
- `deleteSceneFiles(orgId, sceneId)` — delegates to `getStrategyForOrg(orgId)`
- `getSceneHdriUrl(orgId, sceneId)` — calls `strategy.getFileUrl('scenes/<sceneId>/environment.hdr')`; returns local FS path or S3 presigned URL

### `scenes` Module — `server/src/modules/scenes/`

**Repositories**
- `scene.repository.ts` — thin `Repository<SceneEntity>` wrapper
- `scene-object.repository.ts` — adds `countByScene(sceneId)`
- `scene-light.repository.ts` — adds `countByScene(sceneId)`

**DTOs**
- `scene.create.request.dto.ts` — `workspaceId (@IsUUID)`, `name (@MaxLength(100))`, `description?`
- `scene.update.request.dto.ts` — `name?`, `description?`, `config?: SceneConfigUpdateDto` (nested validated with `@ValidateNested`)
- `scene-object.upsert.dto.ts` — `modelId (@IsUUID)`, optional float pos/rot/scale, optional `order`
- `scene-light.upsert.dto.ts` — `type (@IsEnum LightType)`, optional pos float, `color (@Matches /^#[0-9a-fA-F]{6}$/)`, `intensity`, `castShadow`
- `scene.response.dto.ts` — `SceneResponseDto` with nested `SceneObjectResponseDto[]` and `SceneLightResponseDto[]`

**Mapper** (`mappers/scene.mapper.ts`)
- Static `SceneMapper.toResponse(entity)`, `toObjectResponse(obj)`, `toLightResponse(light)`

**Service** (`services/scenes.service.ts`)
- Scene CRUD: `createScene`, `listScenes`, `getScene`, `updateScene`, `deleteScene` (soft-delete + `deleteSceneFiles`)
- Object management: `addObject`, `updateObject`, `removeObject` — enforces `SCENE_LIMITS[planType].maxObjects`
- Light management: `addLight`, `updateLight`, `removeLight` — enforces `SCENE_LIMITS[planType].maxLights`
- HDRI: `uploadHdri` (checks `hdriEnabled`; saves via `filesService.saveSceneHdri`); `getHdriFile` — returns `StreamableFile` (local FS) or `{ redirect: string }` (S3 presigned URL)
- Thumbnail: `saveThumbnail` decodes base64 PNG, writes via strategy
- Access control: `requireMember` checks workspace membership via `WorkspaceMemberRepository`
- Plan resolution: `workspaceId → WorkspaceEntity.orgId → OrganizationEntity.planType → SCENE_LIMITS[planType]`

**Controller** (`controllers/scenes.controller.ts`) — prefix `/scenes`, 14 routes:
- `POST /scenes` — create scene
- `GET /scenes` — list scenes for workspaceId (query param)
- `GET /scenes/:id` — get scene with objects + lights
- `PATCH /scenes/:id` — update scene metadata/config
- `DELETE /scenes/:id` — soft-delete scene + cleanup files
- `POST /scenes/:id/objects` — add object (enforces maxObjects)
- `PATCH /scenes/:id/objects/:objectId` — update object transform/order
- `DELETE /scenes/:id/objects/:objectId` — remove object
- `POST /scenes/:id/lights` — add light (enforces maxLights)
- `PATCH /scenes/:id/lights/:lightId` — update light
- `DELETE /scenes/:id/lights/:lightId` — remove light
- `POST /scenes/:id/hdri` — upload HDRI (multipart, @Public HDRI route needs auth, guarded by hdriEnabled)
- `GET /scenes/:id/hdri` — stream or redirect HDRI file (`@Public()`)
- `POST /scenes/:id/thumbnail` — save thumbnail from base64

**Module** (`scenes.module.ts`)
- `TypeOrmModule.forFeature([SceneEntity, SceneObjectEntity, SceneLightEntity])`
- Imports: `WorkspacesModule`, `FileStorageModule`
- Exports: `ScenesService`

### App Registration
- `ScenesModule` added to `app.module.ts` imports

### Decisions
- `SceneEntity.workspaceId` is NOT NULL — scenes always belong to a workspace (no personal scenes on MVP)
- Plan type resolved via `workspace → org.planType` (not a separate `workspace.plan` column)
- HDRI URL strategy: local FS → `StreamableFile` (controller reads path + streams); S3 → controller redirects 307 to presigned URL
- `HDRI_MAX_SIZE_BYTES` constant defined inline in controller (50 MB) for multer `limits.fileSize`
- Objects and lights are hard-deleted (not soft-deleted) on remove — no audit trail needed for scene geometry

### Verification
- `cd server && npm run build` — 0 errors
- `cd server && npm run lint` — 0 errors (1 pre-existing warning in versions.service.ts, 2 pre-existing `_entryFile` warnings in file strategies)
- `cd server && npm run migration:run` — `InitScenes1776940000000` applied successfully
