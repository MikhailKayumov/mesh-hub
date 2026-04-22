# STEP-2 — Organizations Module (Backend)

**Block:** 1 — Orgs & Workspaces
**Prerequisites:** STEP-1
**Parallel with:** STEP-3 (after STEP-1 is done)

---

## Goal

Implement the full NestJS `organizations` module: CRUD, membership management,
invite flow, and `OrgMemberGuard`.

---

## Directory Structure

```
server/src/modules/organizations/
├── organizations.module.ts
├── controllers/
│   └── organization.controller.ts
├── services/
│   └── organization.service.ts
├── repositories/
│   ├── organization.repository.ts
│   ├── org-member.repository.ts
│   └── org-invite.repository.ts
├── mappers/
│   └── organization.mapper.ts
├── dto/
│   ├── organization.create.request.dto.ts
│   ├── organization.update.request.dto.ts
│   ├── organization.response.dto.ts
│   ├── org-member.response.dto.ts
│   └── org-invite.create.request.dto.ts
└── guards/
    ├── org-member.guard.ts
    └── org-member-role.decorator.ts
```

---

## DTOs

### `organization.create.request.dto.ts`

Fields: `name: string` (@IsString, @IsNotEmpty, @MaxLength(100)),
`slug: string` (@IsString, @Matches(/^[a-z0-9-]+$/), @MaxLength(50)).

### `organization.update.request.dto.ts`

Fields: `name?: string` (optional, @IsOptional, same validators).

### `organization.response.dto.ts`

Fields: `id`, `name`, `slug`, `planType`, `createdAt`.
Include nested `subscription?: OrgSubscriptionSummaryDto` when loaded.

### `org-member.response.dto.ts`

Fields: `userId`, `email`, `firstName`, `lastName`, `role`, `joinedAt` (createdAt of member entity).

### `org-invite.create.request.dto.ts`

Fields: `email: string` (@IsEmail), `role: OrgMemberRole` (@IsEnum(OrgMemberRole)).

---

## Repositories

Each repository extends `Repository<Entity>` following the existing `Model3dRepository` pattern.

`OrgMemberRepository` — add method:
```ts
findByOrgAndUser(orgId: string, userId: string): Promise<OrgMemberEntity | null>
```

`OrgInviteRepository` — add method:
```ts
findActiveByToken(token: string): Promise<OrgInviteEntity | null>
// WHERE token = ? AND accepted_at IS NULL AND expires_at > NOW()
```

---

## Mapper

`OrganizationMapper.toResponse(entity)` — maps entity to `OrganizationResponseDto`.
`OrganizationMapper.toMemberResponse(memberEntity)` — includes joined user data.

---

## Service: `OrganizationService`

### `createOrganization(user, dto)`

1. Check `slug` uniqueness (unique DB constraint will catch, but throw 409 with clear message).
2. Wrap in transaction:
   - Create `OrganizationEntity`.
   - Create `OrgSubscriptionEntity` with plan `starter`, limits: `storageLimitBytes = 50 * 1024^3`, `seatsLimit = 10`, `storageBackend = local`.
   - Create `OrgMemberEntity` with `role = owner`.
3. Return `OrganizationResponseDto`.

### `getCurrentUserOrganizations(user)`

Query `OrgMemberEntity` WHERE `user_id = user.id`, JOIN `organization`.

### `getOrganization(orgId, user)`

Find org; verify caller is a member (via `OrgMemberRepository.findByOrgAndUser`); throw 403 if not.

### `updateOrganization(orgId, user, dto)`

Verify caller role ≥ `admin`; merge and save.

### `getMembers(orgId, user)`

Verify membership; return paginated member list with joined user data.

### `inviteMember(orgId, user, dto)`

1. Verify caller role ≥ `admin`.
2. Check seats quota: count existing members, compare to `OrgSubscription.seatsLimit`.
3. Check if email is already a member.
4. Create `OrgInviteEntity` with `token = uuid()`, `expiresAt = now() + 7 days`.
5. Call `NotificationsService.sendOrgInviteEmail(invite, org)`.
6. Return 201 Created.

### `acceptInvite(token)`  ← `@Public()` endpoint

1. Find invite via `OrgInviteRepository.findActiveByToken(token)`.
2. Find user by `invite.invitedEmail`; if not found, throw 422 (must register first).
3. Check user is not already a member.
4. In transaction: create `OrgMemberEntity`; set `invite.acceptedAt = now()`.

### `changeMemberRole(orgId, actorUser, targetUserId, role)`

- Verify actor role ≥ `admin`.
- Cannot change `owner` role (only one owner per org on MVP).
- Cannot demote yourself.

### `removeMember(orgId, actorUser, targetUserId)`

- Verify actor role ≥ `admin`, or actor === target (leaving the org).
- Cannot remove the owner.
- Soft-delete the `OrgMemberEntity`.

---

## Controller: `OrganizationController`

Prefix: `/organizations`.

| Method | Route | Auth | Handler |
|---|---|---|---|
| POST | `/` | `@Roles([User])` | `createOrganization` |
| GET | `/current` | `@Roles([User])` | `getCurrentUserOrganizations` |
| GET | `/:id` | `@Roles([User])` | `getOrganization` |
| PATCH | `/:id` | `@OrgMemberRole(admin)` | `updateOrganization` |
| GET | `/:id/members` | `@OrgMemberRole(viewer)` | `getMembers` |
| POST | `/:id/invite` | `@OrgMemberRole(admin)` | `inviteMember` |
| POST | `/invite/accept` | `@Public()` | `acceptInvite` (query param `token`) |
| PATCH | `/:id/members/:userId` | `@OrgMemberRole(admin)` | `changeMemberRole` |
| DELETE | `/:id/members/:userId` | `@Roles([User])` | `removeMember` |

---

## `OrgMemberGuard`

**File:** `server/src/modules/organizations/guards/org-member.guard.ts`

Implements `CanActivate`:
1. Extract `orgId` from `request.params.id`.
2. Extract `userId` from `request.user.id` (already set by `JwtAuthGuard`).
3. Query `OrgMemberRepository.findByOrgAndUser(orgId, userId)`.
4. If not found → throw `ForbiddenException`.
5. Read required role from `Reflector` using `@OrgMemberRole(...)` metadata key.
6. Check role hierarchy: `owner > admin > editor > viewer`.
7. Attach `member` to `request.orgMember` for use in service.

**File:** `server/src/modules/organizations/guards/org-member-role.decorator.ts`

```ts
export const OrgMemberRole = (...roles: OrgMemberRole[]) =>
  SetMetadata(ORG_MEMBER_ROLE_KEY, roles);
```

---

## Module Registration

**`organizations.module.ts`:**
```ts
imports: [TypeOrmModule.forFeature([
  OrganizationEntity, OrgMemberEntity, OrgSubscriptionEntity, OrgInviteEntity
]), NotificationsModule],
providers: [...repositories, OrganizationService, OrgMemberGuard],
exports: [OrganizationService, OrgMemberRepository],
controllers: [OrganizationController],
```

**`app.module.ts`:** Import `OrganizationsModule`.

---

## Verification

1. `POST /api/organizations` with valid body → 201 + org object; DB has org + subscription + owner member.
2. `POST /api/organizations/:id/invite` → email sent (check NotificationsModule mock); invite row in DB.
3. `GET /api/organizations/invite/accept?token=<valid>` → 200; member row created.
4. Non-member `GET /api/organizations/:id` → 403.
5. `npm run lint` passes.
