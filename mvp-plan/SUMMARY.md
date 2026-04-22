# MeshHub MVP — Implementation Summary

> **Update this file after completing each step.**
> Status: `TODO` → `IN PROGRESS` → `DONE`

## Progress

| Step | Block | Title | Status | Notes |
|---|---|---|---|---|
| STEP-0 | Pre-MVP | Critical Fixes (FS, Migration, Security) | DONE | |
| STEP-1 | 1 | DB Entities — Orgs & Workspaces | DONE | |
| STEP-2 | 1 | Organizations Module Backend | DONE | |
| STEP-3 | 1 | Workspaces Module Backend | TODO | |
| STEP-4 | 1 | Frontend — Orgs/Workspaces | TODO | |
| STEP-5 | 1.5 | ZIP Support Backend | TODO | |
| STEP-6 | 1.5 | ZIP Support Frontend | TODO | |
| STEP-7 | 2 | StorageQuota + OrgSubscription | TODO | |
| STEP-8 | 2 | S3 File Strategy | TODO | |
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
- Updated model-3d.response.dto.ts, model-3d.update.request.dto.ts, model-3d.mapper.ts, service filter, and client dto.ts/new_dto.ts/`EditPropertiesDrawer/constants.ts`

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
