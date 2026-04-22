# STEP-1 — Database Entities: Organizations & Workspaces

**Block:** 1 — Orgs & Workspaces
**Prerequisites:** STEP-0
**Parallel with:** STEP-5 (ZIP support is independent)

---

## Goal

Create all DB entities, constants, SQL init scripts, and TypeORM migrations for the
organizations and workspaces schemas.

---

## 1. Update `database/constants.ts`

**File:** `server/src/database/constants.ts`

Add to `DatabaseSchemas`:
```ts
Organizations: 'organizations',
Workspaces: 'workspaces',
```

Add new table constant objects:
```ts
export const OrganizationsSchemaTables = {
  Organization: 'organization',
  OrgMember: 'org_member',
  OrgSubscription: 'org_subscription',
  OrgInvite: 'org_invite',
} as const;

export const WorkspacesSchemaTables = {
  Workspace: 'workspace',
  WorkspaceMember: 'workspace_member',
} as const;
```

---

## 2. SQL Init Scripts

**Directory:** `server/src/database/migrations/init/`

Create `organizations.sql`:
```sql
CREATE SCHEMA IF NOT EXISTS organizations;
CREATE TYPE organizations.plan_type AS ENUM ('starter', 'growth', 'enterprise');
CREATE TYPE organizations.org_member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE organizations.storage_backend AS ENUM ('local', 's3');
```

Create `workspaces.sql`:
```sql
CREATE SCHEMA IF NOT EXISTS workspaces;
CREATE TYPE workspaces.workspace_member_role AS ENUM ('editor', 'viewer');
```

Update the existing DB init script runner (`db:init` npm script) to execute these files
after the existing init script.

---

## 3. Entity Files

**Directory:** `server/src/database/entities/organizations/`

### `organization.entity.ts`

Columns: `name: string`, `slug: string` (unique), `planType: PlanType enum`.
Extends `GuidIdEntityBase`. Schema: `organizations`, table: `organization`.

Enum const: `export enum PlanType { Starter = 'starter', Growth = 'growth', Enterprise = 'enterprise' }`

### `org-member.entity.ts`

Columns: `role: OrgMemberRole`.
Relations: `@ManyToOne(() => OrganizationEntity)` → `org_id`, `@ManyToOne(() => UserEntity)` → `user_id`.
Extends `GuidIdEntityBase`. Table: `org_member`.
Add composite unique constraint on `(org_id, user_id)`.

Enum const: `export enum OrgMemberRole { Owner = 'owner', Admin = 'admin', Editor = 'editor', Viewer = 'viewer' }`

### `org-subscription.entity.ts`

Columns: `storageLimitBytes: bigint` (nullable, null = unlimited), `seatsLimit: integer` (nullable),
`storageBackend: StorageBackend enum`, `storageConfigEncrypted: text` (nullable).
Relations: `@OneToOne(() => OrganizationEntity)` → `org_id`.
Extends `GuidIdEntityBase`. Table: `org_subscription`.

Enum const: `export enum StorageBackend { Local = 'local', S3 = 's3' }`

### `org-invite.entity.ts`

Columns: `invitedEmail: string`, `role: OrgMemberRole`, `token: string` (UUID, unique),
`expiresAt: Date`, `acceptedAt: Date` (nullable).
Relations: `@ManyToOne(() => OrganizationEntity)` → `org_id`.
Extends `GuidIdEntityBase`. Table: `org_invite`.

**Directory:** `server/src/database/entities/workspaces/`

### `workspace.entity.ts`

Columns: `name: string`.
Relations: `@ManyToOne(() => OrganizationEntity)` → `org_id`.
Extends `GuidIdEntityBase`. Table: `workspace`.

### `workspace-member.entity.ts`

Columns: `role: WorkspaceMemberRole enum`.
Relations: `@ManyToOne(() => WorkspaceEntity)` → `workspace_id`, `@ManyToOne(() => UserEntity)` → `user_id`.
Extends `GuidIdEntityBase`. Table: `workspace_member`.
Add composite unique on `(workspace_id, user_id)`.

Enum const: `export enum WorkspaceMemberRole { Editor = 'editor', Viewer = 'viewer' }`

---

## 4. TypeORM Migrations

**Directory:** `server/src/database/migrations/organizations/`

Create migration `<timestamp>-InitOrganizations.ts` covering:
- `organizations.organization` table
- `organizations.org_member` table (FK to `users.user` and `organizations.organization`)
- `organizations.org_subscription` table (FK + OneToOne constraint to `organizations.organization`)
- `organizations.org_invite` table (FK to `organizations.organization`)
- All enum types (created in SQL init scripts — migration should handle case where they already exist)
- Unique constraint on `organization.slug`
- Composite unique on `org_member(org_id, user_id)`

**Directory:** `server/src/database/migrations/workspaces/`

Create migration `<timestamp>-InitWorkspaces.ts` covering:
- `workspaces.workspace` table (FK to `organizations.organization`)
- `workspaces.workspace_member` table (FK to `workspaces.workspace` + `users.user`)
- Composite unique on `workspace_member(workspace_id, user_id)`

---

## 5. Register Entities in Data Source

**File:** `server/src/database/data.source.ts`

Add all 6 new entities to the `entities` array.

---

## Verification

1. `npm run migration:run` in `server/` succeeds with no errors.
2. `\dt organizations.*` in psql shows 4 tables.
3. `\dt workspaces.*` shows 2 tables.
4. `\d organizations.org_member` shows FK constraints on both `org_id` and `user_id`.
