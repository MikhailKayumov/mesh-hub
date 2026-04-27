# Database

## Technology

- **Database**: PostgreSQL 18
- **ORM**: TypeORM 0.3
- **Connection**: configured via `ConfigService.typeOrmOptions`, injected in `AppModule`
- **Naming strategy**: custom `TypeOrmNamingStrategy` (camelCase property → snake_case column)

---

## Schema Layout

```
PostgreSQL database (meshhub)
│
├── auth
│   └── session
│
├── users
│   ├── user
│   ├── user_meta
│   ├── role
│   ├── user_role           (M:M join: user ↔ role)
│   └── user_reset_password
│
├── resources
│   ├── cg_soft
│   └── category
│
├── model_3d
│   ├── model_3d
│   ├── model_3d_file
│   ├── model_3d_categories  (M:M join: model_3d ↔ category)
│   ├── model_comment
│   ├── model_annotation
│   └── model_version
│
├── organizations
│   ├── organization
│   ├── org_member
│   ├── org_subscription
│   └── org_invite
│
├── workspaces
│   ├── workspace
│   └── workspace_member
│
├── embed
│   ├── api_key
│   ├── embed_project
│   ├── embed_domain_whitelist
│   └── model_view_log
│
└── scenes
    ├── scene
    ├── scene_object
    └── scene_light
```

Schema and table name constants are defined in `src/database/constants.ts`.

---

## Base Entity Classes

All entities extend one of these abstract base classes (`src/database/entities/base.ts`):

### `GuidIdEntityBase` — UUID primary key
```
id         UUID (PK, auto-generated)
created_at timestamp with time zone  NOT NULL
updated_at timestamp with time zone  nullable
deleted_at timestamp with time zone  nullable  ← soft-delete column
```

### `IntIdBaseEntity` — Auto-increment integer primary key
```
id         SERIAL (PK)
created_at timestamp with time zone  NOT NULL
updated_at timestamp with time zone  nullable
deleted_at timestamp with time zone  nullable
```

---

## Entities

### `auth.session` — `SessionEntity`

File: `src/database/entities/session/session.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Session ID |
| `user_id` | UUID | FK → users.user, CASCADE DELETE | Owner |
| `access_token` | text | NOT NULL, UNIQUE | Current access JWT |
| `refresh_token` | text | NOT NULL, UNIQUE | Current refresh JWT |
| `ip` | inet | NOT NULL | Client IP at creation |
| `user_agent` | text | nullable | Client user agent |
| `expired_at` | timestamp tz | NOT NULL | Session expiry |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `users.user` — `UserEntity`

File: `src/database/entities/user/user.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `email` | text | NOT NULL, UNIQUE | — |
| `phone` | text | nullable, UNIQUE | Russian format: `+7XXXXXXXXXX` |
| `password` | text | NOT NULL | PBKDF2 hash (hex) |
| `salt` | text | NOT NULL | Per-user salt |
| `first_name` | text | nullable | — |
| `middle_name` | text | nullable | — |
| `last_name` | text | nullable | — |
| `is_confirmed` | boolean | NOT NULL, default false | Email confirmation |
| `is_active` | boolean | NOT NULL, default true | Account enabled |
| `last_login_date` | timestamp tz | nullable | Set on each login |
| `user_meta_id` | UUID | FK → users.user_meta | Profile extras |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

**Relations**

| Relation | Target | Type | Details |
|---|---|---|---|
| `userMeta` | `UserMetaEntity` | OneToOne | Eager loaded, cascade, join on `user_meta_id` |
| `roles` | `RoleEntity` | ManyToMany | Join table `users.user_role` |
| `sessions` | `SessionEntity` | OneToMany | — |
| `models3d` | `Model3dEntity` | OneToMany | — |

---

### `users.user_meta` — `UserMetaEntity`

File: `src/database/entities/user/user-meta.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `about_yourself` | text | nullable | Free-text bio |
| `avatar` | text | nullable | Avatar filename (not full path) |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | — |

**Relations**

| Relation | Target | Type | Details |
|---|---|---|---|
| `favoriteSoft` | `CgSoftEntity` | ManyToMany | Join table (in user_meta entity) |

---

### `users.role` — `RoleEntity`

File: `src/database/entities/user/role.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | — |
| `name` | text | NOT NULL, UNIQUE | `'super-user'` \| `'admin'` \| `'user'` |
| `description` | text | nullable | — |
| `created_at` | timestamp tz | NOT NULL | — |

---

### `users.user_reset_password` — `UserResetPasswordEntity`

File: `src/database/entities/user/user-reset-password.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Used as the reset token |
| `user_id` | UUID | FK → users.user, CASCADE DELETE | — |
| `expired_at` | timestamp tz | NOT NULL | Expiry (from `RESET_PASSWORD_EXPIRE_SECONDS`) |
| `created_at` | timestamp tz | NOT NULL | — |

---

### `resources.cg_soft` — `CgSoftEntity`

File: `src/database/entities/resources/cg-soft.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | — |
| `name` | text | NOT NULL, UNIQUE | Software name (e.g., "Blender") |
| `description` | text | nullable | — |
| `created_at` | timestamp tz | NOT NULL | — |

---

### `resources.category` — `CategoryEntity`

File: `src/database/entities/resources/category.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | — |
| `name` | text | NOT NULL, UNIQUE | Category name (e.g., "Animals") |
| `description` | text | nullable | — |
| `created_at` | timestamp tz | NOT NULL | — |

---

### `model_3d.model_3d` — `Model3dEntity`

File: `src/database/entities/models-3d/model-3d.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `user_id` | UUID | FK → users.user, CASCADE DELETE | Owner |
| `name` | text | NOT NULL | Display name |
| `file_id` | UUID | FK → model_3d.model_3d_file | Associated file |
| `description` | jsonb | nullable | Rich text (Tiptap/ProseMirror JSON) |
| `thumbnail` | text | nullable | Thumbnail filename |
| `is_visible` | boolean | NOT NULL, default true | Public visibility |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

**Relations**

| Relation | Target | Type | Details |
|---|---|---|---|
| `user` | `UserEntity` | ManyToOne | Join on `user_id`, CASCADE DELETE |
| `file` | `Model3dFileEntity` | OneToOne | Eager loaded, cascade, join on `file_id` |
| `categories` | `CategoryEntity` | ManyToMany | Join table `model_3d.model_3d_categories` |
| `comments` | `ModelCommentEntity` | OneToMany | — |
| `annotations` | `ModelAnnotationEntity` | OneToMany | Ordered by `order` |
| `versions` | `ModelVersionEntity` | OneToMany | — |

---

### `model_3d.model_3d_file` — `Model3dFileEntity`

File: `src/database/entities/models-3d/model-3d-file.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `name` | text | NOT NULL | Original filename |
| `size` | bigint | NOT NULL | File size in bytes |
| `extension` | text | NOT NULL | `.glb` or `.gltf` |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | — |

---

### `model_3d.model_comment` — `ModelCommentEntity`

File: `src/database/entities/models-3d/model-comment.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d | Parent model |
| `user_id` | UUID | FK → users.user | Author |
| `text` | text | NOT NULL | Comment body |
| `rating` | integer | nullable | 1–5 stars |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `model_3d.model_annotation` — `ModelAnnotationEntity`

File: `src/database/entities/models-3d/model-annotation.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d | Parent model |
| `label` | text | NOT NULL | Short label |
| `text` | text | nullable | Detailed annotation text |
| `position_x` | float | NOT NULL | World-space X |
| `position_y` | float | NOT NULL | World-space Y |
| `position_z` | float | NOT NULL | World-space Z |
| `order` | integer | NOT NULL, default 0 | Display order |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `model_3d.model_version` — `ModelVersionEntity`

File: `src/database/entities/models-3d/model-version.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d | Parent model |
| `file_id` | UUID | FK → model_3d.model_3d_file | Version file record |
| `version_number` | integer | NOT NULL | Auto-incremented |
| `is_active` | boolean | NOT NULL, default false | Active (displayed) version |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `organizations.organization` — `OrganizationEntity`

File: `src/database/entities/organizations/organization.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `name` | text | NOT NULL | Display name |
| `slug` | text | NOT NULL, UNIQUE | URL-safe identifier |
| `owner_id` | UUID | FK → users.user | Owner (non-removable member) |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `organizations.org_member` — `OrgMemberEntity`

File: `src/database/entities/organizations/org-member.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization | Org |
| `user_id` | UUID | FK → users.user | Member |
| `role` | text | NOT NULL | `owner` \| `admin` \| `viewer` |
| `created_at` | timestamp tz | NOT NULL | — |

---

### `organizations.org_subscription` — `OrgSubscriptionEntity`

File: `src/database/entities/organizations/org-subscription.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization, UNIQUE | Org (one-to-one) |
| `plan` | text | NOT NULL, default `starter` | `starter` \| `growth` \| `enterprise` |
| `storage_limit` | bigint | NOT NULL | Max bytes (plan-based) |
| `s3_enabled` | boolean | NOT NULL, default false | S3 strategy active |
| `s3_config` | text | nullable | AES-256-CBC encrypted JSON blob |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |

---

### `organizations.org_invite` — `OrgInviteEntity`

File: `src/database/entities/organizations/org-invite.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Invite token |
| `org_id` | UUID | FK → organizations.organization | Target org |
| `email` | text | NOT NULL | Invitee email |
| `role` | text | NOT NULL | Role granted on accept |
| `expired_at` | timestamp tz | NOT NULL | Expiry |
| `created_at` | timestamp tz | NOT NULL | — |

---

### `workspaces.workspace` — `WorkspaceEntity`

File: `src/database/entities/workspaces/workspace.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization | Parent org |
| `name` | text | NOT NULL | Display name |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `workspaces.workspace_member` — `WorkspaceMemberEntity`

File: `src/database/entities/workspaces/workspace-member.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `workspace_id` | UUID | FK → workspaces.workspace | Workspace |
| `org_member_id` | UUID | FK → organizations.org_member | Member |
| `created_at` | timestamp tz | NOT NULL | — |

---

### `embed.api_key` — `ApiKeyEntity`

File: `src/database/entities/embed/api-key.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization | Scoped org |
| `name` | text | NOT NULL | Display name |
| `key_hash` | text | NOT NULL, UNIQUE | SHA-256 hash of raw key |
| `created_at` | timestamp tz | NOT NULL | — |
| `deleted_at` | timestamp tz | nullable | soft delete (revoke) |

---

### `embed.embed_project` — `EmbedProjectEntity`

File: `src/database/entities/embed/embed-project.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization | Owner org |
| `model_id` | UUID | FK → model_3d.model_3d | Embedded model |
| `name` | text | NOT NULL | Display name |
| `logo` | text | nullable | Logo filename |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `embed.embed_domain_whitelist` — `EmbedDomainWhitelistEntity`

File: `src/database/entities/embed/embed-domain-whitelist.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `project_id` | UUID | FK → embed.embed_project | Project |
| `domain` | text | NOT NULL | Allowed origin domain |
| `created_at` | timestamp tz | NOT NULL | — |

---

### `embed.model_view_log` — `ModelViewLogEntity`

File: `src/database/entities/embed/model-view-log.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `project_id` | UUID | FK → embed.embed_project | Project |
| `ip` | inet | nullable | Viewer IP |
| `user_agent` | text | nullable | Viewer user agent |
| `referer` | text | nullable | Origin page |
| `created_at` | timestamp tz | NOT NULL | View timestamp |

---

### `scenes.scene` — `SceneEntity`

File: `src/database/entities/scenes/scene.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `workspace_id` | UUID | FK → workspaces.workspace | Parent workspace |
| `name` | text | NOT NULL | Display name |
| `hdri_path` | text | nullable | Relative HDRI file path |
| `camera_bookmark` | jsonb | nullable | Saved camera state |
| `thumbnail` | text | nullable | Thumbnail filename |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `scenes.scene_object` — `SceneObjectEntity`

File: `src/database/entities/scenes/scene-object.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `scene_id` | UUID | FK → scenes.scene | Parent scene |
| `model_id` | UUID | FK → model_3d.model_3d | Placed model |
| `position_x/y/z` | float | NOT NULL | World-space position |
| `rotation_x/y/z` | float | NOT NULL | Euler rotation (radians) |
| `scale_x/y/z` | float | NOT NULL, default 1 | Scale per axis |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `scenes.scene_light` — `SceneLightEntity`

File: `src/database/entities/scenes/scene-light.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `scene_id` | UUID | FK → scenes.scene | Parent scene |
| `type` | text | NOT NULL | `directional` \| `point` \| `spot` \| `ambient` |
| `color` | text | NOT NULL, default `#ffffff` | Hex color |
| `intensity` | float | NOT NULL, default 1 | Brightness multiplier |
| `position_x/y/z` | float | NOT NULL | World-space position |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

## Migrations

Located in `src/database/migrations/`, grouped by schema:

| File | Description |
|---|---|
| `init/1703017999243-Init.ts` | Creates all schemas (`auth`, `users`, `resources`, `model_3d`), all initial tables, indexes, and constraints |
| `models-3d/1703082170953-AddModel3DFileEntity.ts` | Extracts file data into a separate `model_3d_file` table; adds `file_id` FK to `model_3d` |
| `models-3d/1704720192661-AddVisibility.ts` | Adds `is_visible` column to `model_3d` |
| `models-3d/...AddComments.ts` | Adds `model_comment` table (schema `model_3d`) |
| `models-3d/...AddAnnotations.ts` | Adds `model_annotation` table |
| `models-3d/...AddVersions.ts` | Adds `model_version` table |
| `organizations/...Init.ts` | Creates `organizations` schema with `organization`, `org_member`, `org_subscription`, `org_invite` tables |
| `workspaces/...Init.ts` | Creates `workspaces` schema with `workspace`, `workspace_member` tables |
| `embed/...Init.ts` | Creates `embed` schema with `api_key`, `embed_project`, `embed_domain_whitelist`, `model_view_log` tables |
| `scenes/...Init.ts` | Creates `scenes` schema with `scene`, `scene_object`, `scene_light` tables |

### Running Migrations

```bash
# Apply all pending
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate a new migration (Linux/Mac)
npm run migration:generate -- --schema=<schema> --name=<Name>

# Generate a new migration (Windows)
npm run migration:generate:win --schema=<schema> --name=<Name>
```

---

## Seeds

Located in `src/database/seeds/`. Run via `npm run db:seeds` (requires a prior `npm run build`).

| Seed | Records created |
|---|---|
| `user/seedRoles.ts` | 3 roles: `super-user`, `admin`, `user` |
| `resources/seedCategories.ts` | ~20 model categories: Animals, Architecture, Art, Transport, Characters, … |

Seeds check for existing records before inserting (idempotent).

---

## TypeORM Naming Strategy

`src/modules/config/typeorm-naming-strategy.ts` — custom naming strategy that converts TypeScript property names (camelCase) to PostgreSQL column names (snake_case) automatically. All `@Column()` decorators with an explicit `name` option take precedence.

---

## Database Initialization

The `src/database/init/index.ts` script runs before migrations and creates any missing schemas. This is called by `npm run db:init`. To drop and recreate all schemas, use `npm run db:init:hard` (pass `DROP_SCHEMAS=true` environment variable).
