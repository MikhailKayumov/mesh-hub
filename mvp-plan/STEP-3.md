# STEP-3 — Workspaces Module (Backend)

**Block:** 1 — Orgs & Workspaces
**Prerequisites:** STEP-1, STEP-2
**Parallel with:** STEP-4 frontend work after this is done

---

## Goal

Implement the `workspaces` NestJS module: CRUD + member management.
Workspaces live inside organizations; workspace membership is a subset of org membership.

---

## Directory Structure

```
server/src/modules/workspaces/
├── workspaces.module.ts
├── controllers/
│   └── workspace.controller.ts
├── services/
│   └── workspace.service.ts
├── repositories/
│   ├── workspace.repository.ts
│   └── workspace-member.repository.ts
├── mappers/
│   └── workspace.mapper.ts
└── dto/
    ├── workspace.create.request.dto.ts
    ├── workspace.update.request.dto.ts
    ├── workspace.response.dto.ts
    └── workspace-member.add.request.dto.ts
```

---

## DTOs

### `workspace.create.request.dto.ts`

Fields: `name: string` (@IsNotEmpty, @MaxLength(100)), `orgId: string` (@IsUUID).

### `workspace.update.request.dto.ts`

Fields: `name?: string` (optional).

### `workspace.response.dto.ts`

Fields: `id`, `name`, `orgId`, `memberCount` (computed), `createdAt`.

### `workspace-member.add.request.dto.ts`

Fields: `userId: string` (@IsUUID), `role: WorkspaceMemberRole` (@IsEnum).

---

## Service: `WorkspaceService`

### `createWorkspace(user, dto)`

1. Verify user is org member with role ≥ `admin` (call `OrgMemberRepository.findByOrgAndUser`).
2. Create `WorkspaceEntity` with `orgId`.
3. Add creator as workspace member with role `editor`.
4. Return `WorkspaceResponseDto`.

### `getMyWorkspaces(user, orgId?)`

Query all workspaces where user has a `WorkspaceMemberEntity`.
Filter by `orgId` if provided.

### `getWorkspace(workspaceId, user)`

Find workspace; verify caller is a member; return DTO.

### `updateWorkspace(workspaceId, user, dto)`

Verify caller is org `admin` or has org-level `admin` role; merge and save.

### `deleteWorkspace(workspaceId, user)`

Soft-delete. Verify caller is org `admin`.
Note: does NOT delete models/scenes assigned to the workspace — they become orphaned
(workspaceId becomes stale FK). On MVP, leave this as a known limitation; a follow-up
migration can add CASCADE or a cleanup job.

### `addMember(workspaceId, actorUser, dto)`

1. Verify actor is org `admin` or workspace `editor`.
2. Verify target user `dto.userId` is an org member.
3. Check not already a workspace member.
4. Create `WorkspaceMemberEntity`.

### `removeMember(workspaceId, actorUser, targetUserId)`

Verify actor is org `admin` or actor === target (self-leave).
Soft-delete `WorkspaceMemberEntity`.

---

## Controller: `WorkspaceController`

Prefix: `/workspaces`.

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/` | `@Roles([User])` | Creates workspace (org admin check in service) |
| GET | `/` | `@Roles([User])` | Optional query param `?orgId=` |
| GET | `/:id` | `@Roles([User])` | Membership check in service |
| PATCH | `/:id` | `@Roles([User])` | Org admin check in service |
| DELETE | `/:id` | `@Roles([User])` | Org admin check in service |
| POST | `/:id/members` | `@Roles([User])` | |
| DELETE | `/:id/members/:userId` | `@Roles([User])` | |

No custom guard here — access control lives in the service because workspace membership
depends on both workspace membership AND org-level role. Keep the controller thin.

---

## Extend `Model3dEntity` for Workspace

**File:** `server/src/database/entities/models-3d/model-3d.entity.ts`

Add column:
```ts
@Column({ type: 'uuid', nullable: true, name: 'workspace_id' })
public workspaceId?: string;
```

Do NOT add a `@ManyToOne` relation to `WorkspaceEntity` here — just the raw FK column
to avoid circular module dependencies. Services can query directly.

**Migration:** `server/src/database/migrations/models-3d/<timestamp>-AddWorkspaceId.ts`
```sql
ALTER TABLE "model_3d"."model_3d" ADD COLUMN "workspace_id" uuid;
-- No FK constraint on MVP — workspace deletion doesn't cascade model deletion
```

**`Model3dRepository`** — extend `findMany()` filter:
- If `workspaceId` filter is passed AND caller is a workspace member → no visibility filter.
- If no `workspaceId` OR caller is not a member → filter `visibility = 'public'` for anonymous,
  or `visibility IN ('public', 'unlisted')` for authenticated non-members.

---

## Module Registration

**`workspaces.module.ts`:**
```ts
imports: [
  TypeOrmModule.forFeature([WorkspaceEntity, WorkspaceMemberEntity]),
  OrganizationsModule,  // for OrgMemberRepository
],
providers: [...repositories, WorkspaceService],
exports: [WorkspaceService, WorkspaceMemberRepository],
controllers: [WorkspaceController],
```

**`app.module.ts`:** Import `WorkspacesModule`.

---

## Verification

1. `POST /api/workspaces` with `orgId` by an org admin → 201 + workspace object.
2. Non-org-member POST → 403.
3. `POST /api/workspaces/:id/members` with non-org-member userId → 400/422.
4. `GET /api/models-3d?workspaceId=<id>` — logged-in workspace member sees private models.
5. Same query anonymous → only public models visible.
