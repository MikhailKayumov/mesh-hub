# STEP-9 — API Keys + Embed Entities (Backend)

**Block:** 3 — Embed Viewer
**Prerequisites:** STEP-2 (org entities), STEP-1 (DB foundations)
**Parallel with:** STEP-7/8 (quota/S3) and STEP-12 (reviews)

---

## Goal

Create all DB entities for the embed and API key features.
Implement the `api-keys` module with `ApiKeyGuard`.

---

## 1. New Schema: `embed`

**`server/src/database/constants.ts`** — Add:
```ts
DatabaseSchemas.Embed = 'embed'

export const EmbedSchemaTables = {
  EmbedProject: 'embed_project',
  EmbedDomainWhitelist: 'embed_domain_whitelist',
  ApiKey: 'api_key',
  ModelViewLog: 'model_view_log',
} as const;
```

**SQL init script:** `server/src/database/migrations/init/embed.sql`
```sql
CREATE SCHEMA IF NOT EXISTS embed;
```

---

## 2. Entity Files

**Directory:** `server/src/database/entities/embed/`

### `api-key.entity.ts`

Columns: `name: string`, `prefix: string` (8 chars, unique index for display),
`keyHash: string` (SHA-256 of raw key, unique), `lastUsedAt: Date` (nullable),
`expiresAt: Date` (nullable), `revokedAt: Date` (nullable).
Relations: `@ManyToOne(() => OrganizationEntity)` → `org_id`.
Extends `GuidIdEntityBase`. Table: `api_key`.

### `embed-project.entity.ts`

Columns: `name: string`, `brandingConfig: json` (nullable), `autoRotate: boolean` (default false).
Relations: `@ManyToOne(() => OrganizationEntity)` → `org_id`,
`@ManyToOne(() => Model3dEntity)` → `model_id` (nullable — project can exist before model is assigned).
Extends `GuidIdEntityBase`. Table: `embed_project`.

`brandingConfig` shape:
```ts
interface BrandingConfig {
  logoUrl?: string;        // URL to uploaded logo file
  primaryColor?: string;   // hex
  showBadge: boolean;      // show "Powered by MeshHub" badge
}
```

### `embed-domain-whitelist.entity.ts`

Columns: `domain: string` (e.g. `example.com`, no protocol).
Relations: `@ManyToOne(() => EmbedProjectEntity)` → `embed_project_id`.
Extends `IntIdBaseEntity` (serial PK). Table: `embed_domain_whitelist`.
Add index on `embed_project_id`.

### `model-view-log.entity.ts`

Columns: `origin: string` (nullable), `durationSeconds: integer` (nullable).
Relations: `@ManyToOne(() => Model3dEntity)` → `model_id`,
`@ManyToOne(() => EmbedProjectEntity, { nullable: true })` → `embed_project_id`.
Extends `IntIdBaseEntity`. Table: `model_view_log`.
**Add composite index:** `(embed_project_id, created_at DESC)` in migration.

---

## 3. Migration

**Directory:** `server/src/database/migrations/embed/`

`<timestamp>-InitEmbed.ts` — creates all 4 tables, FKs, indexes.

---

## 4. `api-keys` Module

**Directory:** `server/src/modules/api-keys/`

```
api-keys/
├── api-keys.module.ts
├── controllers/
│   └── api-key.controller.ts
├── services/
│   └── api-key.service.ts
├── repositories/
│   └── api-key.repository.ts
├── dto/
│   ├── api-key.create.request.dto.ts
│   └── api-key.response.dto.ts
└── guards/
    └── api-key.guard.ts
```

### `ApiKeyService`

**`generate(orgId, user, dto)`:**
1. Generate raw key: `<prefix>_<32 random bytes as base64url>` — total ~50 chars.
2. `prefix` = first 8 chars of the random part.
3. Store `keyHash = SHA256(rawKey).hex`.
4. Save entity with `orgId`, `name`, `prefix`, `keyHash`.
5. Return `{ id, name, prefix, rawKey }` — **raw key is shown only once**.

**`list(orgId, user)`:** Return `[{ id, name, prefix, lastUsedAt, expiresAt, revokedAt }]`.
Never return `keyHash`.

**`revoke(keyId, orgId, user)`:**
Set `revokedAt = now()`. Verify ownership (orgId matches).

### Controller: `ApiKeyController`

Prefix: `/api-keys`. All endpoints require `@Roles([User])`.

| Method | Route | Handler |
|---|---|---|
| POST | `/` | `generate` — body: `{ orgId, name }` |
| GET | `/` | `list` — query: `?orgId=` |
| DELETE | `/:id` | `revoke` |

### `ApiKeyGuard`

**File:** `server/src/modules/api-keys/guards/api-key.guard.ts`

Implements `CanActivate`:
1. Read `X-Api-Key` header from request.
2. If not present → throw `UnauthorizedException`.
3. Compute `SHA256(headerValue)`.
4. Query `ApiKeyRepository.findByHash(hash)`.
5. If not found → throw `UnauthorizedException` (same error, no timing leak).
6. If `revokedAt != null` → throw `UnauthorizedException`.
7. If `expiresAt != null && expiresAt < now()` → throw `UnauthorizedException`.
8. Update `lastUsedAt = now()` (fire-and-forget, don't await).
9. Attach `apiKey` entity to `request.apiKey`.

The guard does NOT apply globally — only to routes decorated with `@UseGuards(ApiKeyGuard)`.

---

## Verification

1. `POST /api/api-keys` → 201 with `rawKey`; repeated `GET /api/api-keys` shows only `prefix`.
2. `X-Api-Key: <rawKey>` on a guarded route → 200.
3. `X-Api-Key: <revokedKey>` → 401.
4. Missing header → 401.
5. `npm run migration:run` succeeds.
