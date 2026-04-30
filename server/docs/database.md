# Database

## Technology

- **Database**: PostgreSQL 18
- **ORM**: TypeORM 0.3
- **Connection**: configured via `ConfigService.typeOrmOptions`, injected in `AppModule`
- **Naming strategy**: custom `TypeOrmNamingStrategy` (camelCase property → snake_case column)

---

## Schema Layout

```
PostgreSQL database (mesh_hub)
│
├── auth
│   └── session
│
├── users
│   ├── user
│   ├── user_meta
│   ├── user_meta_cg_soft     (M:M join: user_meta ↔ cg_soft)
│   ├── role
│   ├── user_role             (M:M join: user ↔ role)
│   └── user_reset_password
│
├── resources
│   ├── cg_soft
│   └── category
│
├── model_3d
│   ├── model_3d
│   ├── model_3d_file
│   ├── model_3d_categories   (M:M join: model_3d ↔ category)
│   ├── model_version
│   ├── model_comment
│   ├── model_annotation
│   ├── model_audio
│   ├── model_light
│   ├── model_material_override
│   └── model_display_config
│
├── organizations
│   ├── organization
│   ├── org_member
│   ├── org_subscription
│   ├── org_invite
│   ├── webhook
│   └── webhook_delivery_log
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
├── scenes
│   ├── scene
│   ├── scene_object
│   ├── scene_light
│   ├── scene_annotation
│   └── scene_comment
│
└── notifications
    └── notification
```

Nine schemas total. Schema and table name constants are defined in `src/database/constants.ts`.

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

Soft delete is the default; TypeORM `softRemove` / `softDelete` set `deleted_at` instead of issuing `DELETE`.

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
| `favoriteSoft` | `CgSoftEntity` | ManyToMany | Join table `users.user_meta_cg_soft` |

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
| `workspace_id` | UUID | nullable | Workspace owner (when org-scoped) |
| `name` | text | NOT NULL | Display name |
| `file_id` | UUID | FK → model_3d.model_3d_file, UNIQUE | Current file (eager) |
| `current_version_id` | UUID | nullable | Active version pointer |
| `description` | json | nullable | Rich text (Tiptap/ProseMirror JSON) |
| `thumbnail` | text | nullable | Thumbnail filename |
| `visibility` | enum `model_visibility` | NOT NULL, default `public` | `public` \| `private` \| `unlisted` |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

**Relations**

| Relation | Target | Type | Details |
|---|---|---|---|
| `user` | `UserEntity` | ManyToOne | Join on `user_id`, CASCADE DELETE |
| `file` | `Model3dFileEntity` | OneToOne | Eager, cascade, join on `file_id` |
| `categories` | `CategoryEntity` | ManyToMany | Join table `model_3d.model_3d_categories` |
| `versions` | `ModelVersionEntity` | OneToMany | — |

---

### `model_3d.model_3d_file` — `Model3dFileEntity`

File: `src/database/entities/models-3d/model-3d-file.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `name` | text | NOT NULL | Stored filename (with extension) |
| `size` | bigint | NOT NULL | File size in bytes |
| `extension` | text | NOT NULL | `.glb` \| `.gltf` \| `.fbx` \| `.zip` \| ... |
| `entry_file` | text | nullable | Entry path inside zipped multi-file uploads |
| `original_format` | varchar(10) | NOT NULL, default `glb` | Source format pre-conversion |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | — |

---

### `model_3d.model_version` — `ModelVersionEntity`

File: `src/database/entities/models-3d/model-version.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d, CASCADE DELETE, indexed | Parent model |
| `uploader_id` | UUID | FK → users.user, CASCADE DELETE, indexed | Uploader |
| `version_number` | int | NOT NULL, default 1 | Auto-incremented per model |
| `file_name` | text | NOT NULL | Stored filename |
| `file_size` | bigint | NOT NULL | Size in bytes |
| `mime_type` | text | NOT NULL | MIME type |
| `entry_file` | text | nullable | Entry path for multi-file uploads |
| `change_notes` | varchar(500) | nullable | Author-supplied notes |
| `is_active` | boolean | NOT NULL, default false | Single active version per model |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `model_3d.model_audio` — `ModelAudioEntity`

File: `src/database/entities/models-3d/model-audio.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d, CASCADE DELETE, indexed | Parent model |
| `filename` | varchar(255) | NOT NULL | Stored filename |
| `original_name` | varchar(255) | NOT NULL | Upload-time name |
| `duration_s` | float8 | nullable | Duration in seconds |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `model_3d.model_light` — `ModelLightEntity`

File: `src/database/entities/models-3d/model-light.entity.ts`

Model-level lights persisted with the model itself (separate from `scenes.scene_light`, which is per-scene).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d, CASCADE DELETE, indexed | Parent model |
| `type` | varchar(15) | NOT NULL | `directional` \| `point` \| `spot` \| `ambient` |
| `pos_x` | float8 | NOT NULL, default 0 | World-space X |
| `pos_y` | float8 | NOT NULL, default 5 | World-space Y |
| `pos_z` | float8 | NOT NULL, default 5 | World-space Z |
| `color` | varchar(9) | NOT NULL, default `#ffffff` | Hex color (rgba supported) |
| `intensity` | float8 | NOT NULL, default 1.0 | Brightness multiplier |
| `cast_shadow` | boolean | NOT NULL, default true | — |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `model_3d.model_display_config` — `ModelDisplayConfigEntity`

File: `src/database/entities/models-3d/model-display-config.entity.ts`

One row per model (UNIQUE on `model_id`); per-model viewer defaults.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d, CASCADE DELETE, UNIQUE | Parent model |
| `background_color` | varchar(9) | NOT NULL, default `#000000` | Viewer clear color |
| `ambient_intensity` | float8 | NOT NULL, default 0.5 | Ambient light multiplier |
| `environment_hdri_path` | text | nullable | HDRI environment file |
| `fog_enabled` | boolean | NOT NULL, default false | — |
| `fog_type` | varchar(10) | NOT NULL, default `linear` | `linear` \| `exp` \| `exp2` |
| `fog_color` | varchar(9) | NOT NULL, default `#cccccc` | — |
| `fog_near` | float8 | NOT NULL, default 10 | — |
| `fog_far` | float8 | NOT NULL, default 100 | — |
| `post_process` | jsonb | nullable | Post-processing pass config |
| `renderer_config` | jsonb | nullable | Renderer overrides (toneMapping, exposure, ...) |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `model_3d.model_material_override` — `ModelMaterialOverrideEntity`

File: `src/database/entities/models-3d/model-material-override.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d, CASCADE DELETE, indexed | Parent model |
| `mesh_name` | varchar(255) | NOT NULL | Targeted mesh |
| `color_hex` | varchar(9) | nullable | Base color override |
| `metalness` | float8 | nullable | — |
| `roughness` | float8 | nullable | — |
| `emissive_hex` | varchar(9) | nullable | — |
| `emissive_intensity` | float8 | nullable | — |
| `opacity` | float8 | nullable | — |
| `wireframe` | boolean | NOT NULL, default false | — |
| `texture_map_path` | text | nullable | Base color map |
| `normal_map_path` | text | nullable | — |
| `roughness_map_path` | text | nullable | — |
| `metalness_map_path` | text | nullable | — |
| `emissive_map_path` | text | nullable | — |
| `ao_map_path` | text | nullable | Ambient occlusion map |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `model_3d.model_annotation` — `ModelAnnotationEntity`

File: `src/database/entities/models-3d/model-annotation.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d, CASCADE DELETE, indexed | Parent model |
| `label` | varchar(50) | NOT NULL | Short label |
| `body` | text | nullable | Detailed annotation text |
| `pos_x` | float8 | NOT NULL | World-space X |
| `pos_y` | float8 | NOT NULL | World-space Y |
| `pos_z` | float8 | NOT NULL | World-space Z |
| `camera_pos_x` | float8 | nullable | Saved camera X |
| `camera_pos_y` | float8 | nullable | Saved camera Y |
| `camera_pos_z` | float8 | nullable | Saved camera Z |
| `order` | int | NOT NULL, default 0 | Display order |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `model_3d.model_comment` — `ModelCommentEntity`

File: `src/database/entities/models-3d/model-comment.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d, CASCADE DELETE, indexed | Parent model |
| `author_id` | UUID | FK → users.user, CASCADE DELETE | Author (eager) |
| `parent_id` | UUID | FK → model_3d.model_comment, SET NULL | Reply parent (threaded) |
| `body` | text | NOT NULL | Comment body |
| `pos_x` | float8 | nullable | Optional pin X |
| `pos_y` | float8 | nullable | Optional pin Y |
| `pos_z` | float8 | nullable | Optional pin Z |
| `resolved` | boolean | default false | — |
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
| `plan_type` | enum `organization_plan_type_enum` | NOT NULL, default `starter` | `starter` \| `growth` \| `enterprise` |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `organizations.org_member` — `OrgMemberEntity`

File: `src/database/entities/organizations/org-member.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization, CASCADE DELETE | Org |
| `user_id` | UUID | FK → users.user, CASCADE DELETE, indexed | Member |
| `role` | enum | NOT NULL | `owner` \| `admin` \| `editor` \| `viewer` |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

UNIQUE (`org_id`, `user_id`). Role weights are defined in code (`OrgMemberRoleWeights`) for hierarchical role checks.

---

### `organizations.org_subscription` — `OrgSubscriptionEntity`

File: `src/database/entities/organizations/org-subscription.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization, CASCADE DELETE, UNIQUE | Org (one-to-one) |
| `storage_limit_bytes` | bigint | nullable | Plan storage cap |
| `seats_limit` | int | nullable | Plan member cap |
| `storage_backend` | enum | NOT NULL, default `local` | `local` \| `s3` |
| `storage_config_encrypted` | text | nullable | AES-256-CBC encrypted JSON blob |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `organizations.org_invite` — `OrgInviteEntity`

File: `src/database/entities/organizations/org-invite.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization, CASCADE DELETE, indexed | Target org |
| `invited_email` | text | NOT NULL | Invitee email |
| `role` | enum | NOT NULL | Role granted on accept |
| `token` | UUID | NOT NULL, UNIQUE | Invite token (URL-safe) |
| `expires_at` | timestamp tz | NOT NULL | Expiry |
| `accepted_at` | timestamp tz | nullable | Accept time (null = pending) |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `organizations.webhook` — `WebhookEntity`

File: `src/database/entities/organizations/webhook.entity.ts`

Outbound HTTP webhooks per organization.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization, CASCADE DELETE, indexed | Owner org |
| `url` | text | NOT NULL | Delivery target URL |
| `events` | text[] | NOT NULL | Subscribed event names |
| `secret` | varchar(255) | NOT NULL | HMAC signing secret |
| `is_active` | boolean | NOT NULL, default true | Soft toggle |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `organizations.webhook_delivery_log` — `WebhookDeliveryLogEntity`

File: `src/database/entities/organizations/webhook-delivery-log.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `webhook_id` | UUID | FK → organizations.webhook, CASCADE DELETE, indexed | Source webhook |
| `event` | varchar(50) | NOT NULL | Event name |
| `payload` | jsonb | NOT NULL | Delivered body |
| `response_status` | int | nullable | Last HTTP status |
| `delivered_at` | timestamp tz | nullable | Success time |
| `failed_at` | timestamp tz | nullable | Last failure time |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `workspaces.workspace` — `WorkspaceEntity`

File: `src/database/entities/workspaces/workspace.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization, CASCADE DELETE | Parent org |
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
| `workspace_id` | UUID | FK → workspaces.workspace, CASCADE DELETE | Workspace |
| `user_id` | UUID | FK → users.user, CASCADE DELETE, indexed | Member |
| `role` | enum | NOT NULL | `editor` \| `viewer` |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

UNIQUE (`workspace_id`, `user_id`).

---

### `embed.api_key` — `ApiKeyEntity`

File: `src/database/entities/embed/api-key.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization, CASCADE DELETE, indexed | Scoped org |
| `name` | text | NOT NULL | Display name |
| `prefix` | varchar(8) | NOT NULL, UNIQUE | First 8 chars of raw key (for lookup) |
| `key_hash` | text | NOT NULL, UNIQUE | SHA-256 hash of raw key |
| `scopes` | text[] | NOT NULL, default `{embed:read}` | Granted scopes |
| `last_used_at` | timestamp tz | nullable | Last accepted usage |
| `expires_at` | timestamp tz | nullable | Optional expiry |
| `revoked_at` | timestamp tz | nullable | Revocation time |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `embed.embed_project` — `EmbedProjectEntity`

File: `src/database/entities/embed/embed-project.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `org_id` | UUID | FK → organizations.organization, CASCADE DELETE, indexed | Owner org |
| `model_id` | UUID | FK → model_3d.model_3d, SET NULL, indexed | Embedded model (XOR with `scene_id`) |
| `scene_id` | UUID | FK → scenes.scene, SET NULL, indexed | Embedded scene (XOR with `model_id`) |
| `name` | text | NOT NULL | Display name |
| `branding_config` | json | nullable | `{ logoUrl, primaryColor, showBadge }` |
| `auto_rotate` | boolean | NOT NULL, default false | Viewer auto-rotation default |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

CHECK `embed_project_target_check`: `num_nonnulls("model_id", "scene_id") = 1` — exactly one of model/scene must be set.

---

### `embed.embed_domain_whitelist` — `EmbedDomainWhitelistEntity`

File: `src/database/entities/embed/embed-domain-whitelist.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | — |
| `embed_project_id` | UUID | FK → embed.embed_project, CASCADE DELETE, indexed | Project |
| `domain` | text | NOT NULL | Allowed origin domain |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `embed.model_view_log` — `ModelViewLogEntity`

File: `src/database/entities/embed/model-view-log.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | — |
| `model_id` | UUID | FK → model_3d.model_3d, CASCADE DELETE, indexed | Viewed model |
| `embed_project_id` | UUID | FK → embed.embed_project, SET NULL, indexed | Originating project (nullable) |
| `origin` | text | nullable | `Origin` header at view time |
| `duration_seconds` | int | nullable | Session duration |
| `created_at` | timestamp tz | NOT NULL | View timestamp |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | — |

---

### `scenes.scene` — `SceneEntity`

File: `src/database/entities/scenes/scene.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `workspace_id` | UUID | FK → workspaces.workspace, CASCADE DELETE, indexed | Workspace owner (nullable) |
| `user_id` | UUID | FK → users.user, CASCADE DELETE, indexed | Personal owner (nullable) |
| `name` | varchar(100) | NOT NULL | Display name |
| `description` | text | nullable | — |
| `config` | jsonb | nullable | Serialized `SceneConfig` (camera, env, fog, post-fx) |
| `thumbnail_path` | text | nullable | Thumbnail file path |
| `visibility` | enum | NOT NULL, default `private` | `public` \| `private` \| `unlisted` |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

CHECK `CHK_scene_owner`: `user_id IS NOT NULL OR workspace_id IS NOT NULL` — every scene has at least one owner.

---

### `scenes.scene_object` — `SceneObjectEntity`

File: `src/database/entities/scenes/scene-object.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `scene_id` | UUID | FK → scenes.scene, CASCADE DELETE, indexed | Parent scene |
| `model_id` | UUID | FK → model_3d.model_3d, indexed | Placed model |
| `pos_x/y/z` | float | default 0 | World-space position |
| `rot_x/y/z` | float | default 0 | Euler rotation (radians) |
| `scale_x/y/z` | float | default 1 | Scale per axis |
| `order` | int | default 0 | Render/listing order |
| `animation_config` | jsonb | nullable | Per-object animation overrides |
| `audio_config` | jsonb | nullable | Per-object audio overrides |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `scenes.scene_light` — `SceneLightEntity`

File: `src/database/entities/scenes/scene-light.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `scene_id` | UUID | FK → scenes.scene, CASCADE DELETE, indexed | Parent scene |
| `type` | enum | NOT NULL | `directional` \| `point` \| `spot` |
| `pos_x/y/z` | float | default 0 | World-space position |
| `color` | varchar(7) | default `#ffffff` | Hex color |
| `intensity` | float | default 1.0 | Brightness multiplier |
| `cast_shadow` | boolean | default true | — |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `scenes.scene_annotation` — `SceneAnnotationEntity`

File: `src/database/entities/scenes/scene-annotation.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `scene_id` | UUID | FK → scenes.scene, CASCADE DELETE, indexed | Parent scene |
| `scene_object_id` | UUID | FK → scenes.scene_object, SET NULL, indexed | Optional anchor object |
| `user_id` | UUID | FK → users.user, CASCADE DELETE, indexed | Author (eager) |
| `label` | varchar(120) | NOT NULL | Short label |
| `body` | text | nullable | Detailed text |
| `pos_x/y/z` | double precision | NOT NULL | World-space position |
| `camera_pos_x/y/z` | double precision | nullable | Saved camera state |
| `order` | int | default 0 | Display order |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `scenes.scene_comment` — `SceneCommentEntity`

File: `src/database/entities/scenes/scene-comment.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `scene_id` | UUID | FK → scenes.scene, CASCADE DELETE, indexed | Parent scene |
| `author_id` | UUID | FK → users.user, CASCADE DELETE, indexed | Author (eager) |
| `parent_id` | UUID | FK → scenes.scene_comment, SET NULL, indexed | Reply parent (threaded) |
| `body` | text | NOT NULL | Comment body |
| `resolved` | boolean | default false | — |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

---

### `notifications.notification` — `NotificationEntity`

File: `src/database/entities/notifications/notification.entity.ts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | — |
| `user_id` | UUID | FK → users.user, CASCADE DELETE | Recipient |
| `type` | varchar(50) | NOT NULL | `comment_added` \| `invite_accepted` \| `model_uploaded` \| `model_version_processed` \| ... |
| `payload` | jsonb | NOT NULL | Type-specific payload |
| `is_read` | boolean | default false | — |
| `created_at` | timestamp tz | NOT NULL | — |
| `updated_at` | timestamp tz | nullable | — |
| `deleted_at` | timestamp tz | nullable | soft delete |

Composite index on (`user_id`, `is_read`) for unread-list queries.

---

## Cross-Schema Relationships

```
users.user ──┬─< auth.session
             ├─< model_3d.model_3d                    (owner)
             ├─< model_3d.model_version               (uploader)
             ├─< model_3d.model_comment.author_id
             ├─< organizations.org_member
             ├─< organizations.org_invite             (via accepted_at)
             ├─< workspaces.workspace_member
             ├─< scenes.scene                         (personal owner, nullable)
             ├─< scenes.scene_annotation
             ├─< scenes.scene_comment.author_id
             └─< notifications.notification

organizations.organization ──┬─< organizations.org_member
                             ├─< organizations.org_subscription   (1:1)
                             ├─< organizations.org_invite
                             ├─< organizations.webhook ──< organizations.webhook_delivery_log
                             ├─< workspaces.workspace
                             ├─< embed.api_key
                             └─< embed.embed_project

workspaces.workspace ──┬─< workspaces.workspace_member
                       └─< scenes.scene                            (workspace owner, nullable)

model_3d.model_3d ──┬─1:1 model_3d.model_3d_file (eager)
                    ├─< model_3d.model_version
                    ├─< model_3d.model_audio
                    ├─< model_3d.model_light
                    ├─1:1 model_3d.model_display_config
                    ├─< model_3d.model_material_override
                    ├─< model_3d.model_annotation
                    ├─< model_3d.model_comment
                    ├─M:N resources.category
                    ├─< scenes.scene_object                        (placement)
                    ├─< embed.embed_project           (model_id, XOR scene_id)
                    └─< embed.model_view_log

scenes.scene ──┬─< scenes.scene_object ──> model_3d.model_3d
               ├─< scenes.scene_light
               ├─< scenes.scene_annotation
               ├─< scenes.scene_comment
               └─< embed.embed_project              (scene_id, XOR model_id)

embed.embed_project ──┬─< embed.embed_domain_whitelist
                      └─< embed.model_view_log
```

Key constraints:

- `embed.embed_project` enforces XOR over (`model_id`, `scene_id`) via CHECK `embed_project_target_check`.
- `scenes.scene` enforces "has an owner" via CHECK `CHK_scene_owner` over (`user_id`, `workspace_id`).
- `model_3d.model_3d.file_id` is UNIQUE — every file row backs at most one model.
- `organizations.org_subscription.org_id` is UNIQUE — strict 1:1 with `organization`.

---

## Migrations

Located in `src/database/migrations/`. The data source globs all `*.ts` under that tree (`migrations: ['src/database/migrations/**/*.ts']`), so per-domain subfolders work today and are the convention going forward.

Current layout:

```
src/database/migrations/
└── 1777486474931-Init.ts        ← consolidated initial schema
```

The `Init` migration creates every schema, table, enum, index, and FK described above in a single transaction. New migrations after the initial baseline are grouped under per-schema subfolders:

```
src/database/migrations/
├── 1777486474931-Init.ts
├── embed/
├── models-3d/
├── notifications/
├── organizations/
├── scenes/
└── workspaces/
```

Subfolder names match `DatabaseSchemas` in `src/database/constants.ts` (kebab-case: `models-3d`).

### Running migrations

```bash
# Apply all pending
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate from current entity diff (writes to migrations/, move it into the right subfolder before commit)
npm run migration:generate -- src/database/migrations/<schema>/<Name>

# Create an empty migration shell
npm run migration:create -- src/database/migrations/<schema>/<Name>
```

`migration:generate` emits a single file capturing the diff between current entities and the last applied migration; place the generated file under the subfolder for the schema it touches. Cross-schema migrations live at the top level.

---

## Seeds

Located in `src/database/seeds/`. Run via `npm run db:seeds` (requires a prior `npm run build`).

| Seed | Records created |
|---|---|
| `user/seedRoles.ts` | 3 roles: `super-user`, `admin`, `user` |
| `user/seedUsers.ts` | Bootstrap super-user from env (`SUPER_USER_EMAIL`, `SUPER_USER_PASSWORD`) |
| `resources/seedCategories.ts` | ~20 model categories: Animals, Architecture, Art, Transport, Characters, … |
| `resources/seedCGSoft.ts` | Common CG software entries (Blender, Maya, 3ds Max, …) |

Seeds check for existing records before inserting (idempotent).

---

## TypeORM Naming Strategy

`src/modules/config/typeorm-naming-strategy.ts` — custom naming strategy that converts TypeScript property names (camelCase) to PostgreSQL column names (snake_case) automatically. All `@Column()` decorators with an explicit `name` option take precedence.

---

## Database Initialization

The `src/database/init/index.ts` script runs before migrations and creates any missing schemas. This is called by `npm run db:init`. To drop and recreate all schemas, use `npm run db:init:hard` (passes `DROP_SCHEMAS=true`).

---

## See Also

- [model-3d.md](model-3d.md) — model storage, versions, annotations, comments, viewer config
- [organizations.md](organizations.md) — organizations, members, subscriptions, invites, webhooks
- [scenes.md](scenes.md) — scene composition, lights, annotations, comments
- [embed.md](embed.md) — embed projects, API keys, domain whitelisting, view logs
- [notifications.md](notifications.md) — notification types and delivery
- [auth.md](auth.md) — sessions, JWT cookie flow, refresh
- [file-storage.md](file-storage.md) — local FS vs S3 strategies, encrypted org S3 config
