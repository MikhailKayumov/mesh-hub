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
└── model_3d
    ├── model_3d
    ├── model_3d_file
    └── model_3d_categories  (M:M join: model_3d ↔ category)
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

## Migrations

Located in `src/database/migrations/`, grouped by schema:

| File | Description |
|---|---|
| `init/1703017999243-Init.ts` | Creates all schemas (`auth`, `users`, `resources`, `model_3d`), all initial tables, indexes, and constraints |
| `models-3d/1703082170953-AddModel3DFileEntity.ts` | Extracts file data into a separate `model_3d_file` table; adds `file_id` FK to `model_3d` |
| `models-3d/1704720192661-AddVisibility.ts` | Adds `is_visible` column to `model_3d` |

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
