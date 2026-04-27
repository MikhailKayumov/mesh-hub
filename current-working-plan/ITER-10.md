# ITER-10 — Migration Consolidation: Single Init File

## Goal

Replace all existing incremental migration files with a single clean `InitAll` migration that reflects the final schema after all iterations. Eliminates migration history debt before first production deployment.

## Status: 🔲 Pending

> **When to do this:** After all preceding iterations are implemented and the schema is stable. This is the last step before first real deploy.

---

## Why

The current migration chain has 10+ files accumulated during development:

```
init/1703017999243-Init.ts
models-3d/1703082170953-AddModel3DFileEntity.ts
models-3d/1704720192661-AddVisibility.ts
models-3d/1776867566495-AddWorkspaceId.ts
models-3d/1776874651523-AddEntryFile.ts
models-3d/1776929000000-AddReviewsAndAnnotations.ts
models-3d/1776930000000-AddModelVersions.ts
organizations/1776862686884-InitOrganizations.ts
workspaces/1776862709317-InitWorkspaces.ts
embed/1776863000000-InitEmbed.ts
scenes/1776940000000-InitScenes.ts
+ migrations added in ITER-1 through ITER-9
```

Since the project has never been deployed to production, there is no existing DB to migrate. All these files serve no historical purpose — they only slow down fresh installs (each runs separately) and add noise. A single init file is cleaner and easier to reason about.

---

## Approach

### Step 1 — Verify clean state

```powershell
cd server
npm run migration:run   # confirm all migrations pass on fresh DB
```

### Step 2 — Drop the DB and schema

```powershell
# Development only — assumes local Docker PostgreSQL
docker compose -f ../docker-compose.dev.yml down -v
docker compose -f ../docker-compose.dev.yml up -d
```

### Step 3 — Generate the consolidated init migration

After all ITER-1..9 entity changes are in place, generate a fresh migration from the current entity state:

```powershell
npm run migration:generate -- --schema=init --name=InitAll
```

This produces `init/{timestamp}-InitAll.ts` that contains the exact schema TypeORM sees from the entities — guaranteed to be in sync.

> **Important:** TypeORM `migration:generate` compares entities vs. DB. Since DB is empty, it emits the full CREATE statements for everything in one file.

### Step 4 — Delete all old migration files

Delete every file in:
```
server/src/database/migrations/init/1703017999243-Init.ts
server/src/database/migrations/models-3d/*.ts
server/src/database/migrations/organizations/*.ts
server/src/database/migrations/workspaces/*.ts
server/src/database/migrations/embed/*.ts
server/src/database/migrations/scenes/*.ts
```

Keep only the new `init/{timestamp}-InitAll.ts`.

### Step 5 — Update migration config

File: `server/src/database/data-source.ts` (or wherever `migrations` path is configured)

Ensure it points to a glob that matches the new file:

```ts
migrations: [join(__dirname, 'migrations/**/*.ts')],
```

No change needed if already using a wildcard glob.

### Step 6 — Remove `typeorm_migrations` history

The `typeorm_migrations` table tracks which migrations ran. On a fresh DB this is empty — nothing to do. If any dev DB has old records, drop and recreate (same as Step 2).

### Step 7 — Run migration on fresh DB, verify

```powershell
npm run migration:run
npm run seed  # if seeds exist
```

All tables created in a single transaction. Confirm with:

```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

---

## Final Schema Checklist (all tables after ITER-1..9)

### Schemas

- `auth` — session
- `users` — user, user_meta, role, user_role, user_meta_cg_soft, user_reset_password
- `resources` — category, cg_soft
- `model_3d` — model_3d, model_3d_file, model_3d_categories, model_comment, model_annotation, model_version, model_material_override, model_audio
- `organizations` — organization, org_member, org_subscription, org_invite, webhook, webhook_delivery_log
- `workspaces` — workspace, workspace_member
- `embed` — api_key, embed_project, embed_domain_whitelist, model_view_log
- `scenes` — scene, scene_object, scene_light, scene_annotation, scene_comment
- `notifications` — notification

### Key columns added across ITER-1..9

| Table | Column | Iteration |
|---|---|---|
| `scenes.scene` | `user_id`, `visibility` | ITER-1 |
| `scenes.scene_object` | `animation_config jsonb` | ITER-5 |
| `model_3d.model_3d_file` | `original_format varchar(10)` | ITER-6 |
| `model_3d.model_material_override` | whole table | ITER-4 |
| `model_3d.model_audio` | whole table | ITER-5 |
| `scenes.scene_annotation` | whole table | ITER-7 |
| `scenes.scene_comment` | whole table | ITER-7 |
| `organizations.webhook` | whole table | ITER-9 |
| `organizations.webhook_delivery_log` | whole table | ITER-9 |
| `notifications.notification` | whole table | ITER-9 |
| `embed.embed_project` | `scene_id uuid nullable` | ITER-9 |
| `embed.api_key` | `scopes text[]` | ITER-9 |

---

## Acceptance Criteria

- [ ] `docker compose down -v && docker compose up -d && npm run migration:run` succeeds from zero
- [ ] Exactly one migration file exists under `server/src/database/migrations/`
- [ ] All tables present after single migration run
- [ ] Seeds run cleanly after migration
- [ ] `npm run start:dev` starts without errors (no schema drift)
- [ ] Old migration files removed from git history (squash commit or delete + commit)
