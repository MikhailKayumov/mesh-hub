# Embed

## Scope

The Embed surface lets organisations publish a 3D model or scene as a public viewer page that can be loaded from a third-party site. It covers four concerns:

- A **public viewer endpoint** (`GET /api/embed/:targetId`) that resolves the target and returns a viewer payload, bypassing the global JWT guard.
- **Per-organisation API keys** (hashed, scoped) that authenticate every public viewer request.
- A **per-project domain whitelist** that restricts which Origins can load the viewer.
- **View logging** for analytics (daily counts, top origins, totals) on the owning project's dashboard.

The surface is split across two NestJS modules:

| Module | Path | Responsibility |
|---|---|---|
| `EmbedModule` | [embed.module.ts](../src/modules/embed/embed.module.ts) | Embed projects, domain whitelist, view logs, public viewer route, logo upload/serve |
| `ApiKeysModule` | [api-keys.module.ts](../src/modules/api-keys/api-keys.module.ts) | API key generation / listing / revocation, `ApiKeyGuard`, scopes, hashing |

`EmbedModule` imports `ApiKeysModule`, `Models3dModule`, `OrganizationsModule`, and `ScenesModule`. It does not provide its own DI globally — only `ApiKeyGuard` and `ApiKeyRepository` are exported from `ApiKeysModule` for reuse.

---

## Entities

All four embed entities live in the `embed` PostgreSQL schema (`DatabaseSchemas.Embed`). Table names are constants in [src/database/constants.ts](../src/database/constants.ts) under `EmbedSchemaTables`.

### `embed.api_key` — [api-key.entity.ts](../src/database/entities/embed/api-key.entity.ts)

`ApiKeyEntity extends GuidIdEntityBase` (UUID `id` + `createdAt`/`updatedAt`/`deletedAt`).

| Column | Type | Notes |
|---|---|---|
| `name` | `text` | Human label shown in the org's API keys list |
| `prefix` | `varchar(8)`, **unique** | First 8 chars of the raw key (printable, never sensitive on its own) |
| `key_hash` | `text`, **unique** | `sha256(rawKey).digest('hex')` — see [api-key.service.ts:17](../src/modules/api-keys/services/api-key.service.ts#L17) |
| `scopes` | `text[]` | Default `['embed:read']`. See `ApiKeyScopes` below. |
| `last_used_at` | `timestamptz`, nullable | Updated fire-and-forget on every successful guard pass |
| `expires_at` | `timestamptz`, nullable | If set and in the past, guard rejects |
| `revoked_at` | `timestamptz`, nullable | If non-null, guard rejects |
| `org_id` | `uuid`, FK → `organizations.organization` | `ON DELETE CASCADE`. Indexed. |

### `embed.embed_project` — [embed-project.entity.ts](../src/database/entities/embed/embed-project.entity.ts)

`EmbedProjectEntity extends GuidIdEntityBase`.

| Column | Type | Notes |
|---|---|---|
| `name` | `text` | Project label |
| `branding_config` | `json`, nullable | `BrandingConfig`: `{ logoUrl?, primaryColor?, showBadge }` |
| `auto_rotate` | `boolean`, default `false` | Whether the viewer auto-rotates the camera |
| `org_id` | `uuid`, FK → `organizations.organization` | `ON DELETE CASCADE`. Indexed. |
| `model_id` | `uuid`, FK → `model_3d.model_3d`, nullable | `ON DELETE SET NULL`. Indexed. |
| `scene_id` | `uuid`, FK → `scenes.scene`, nullable | `ON DELETE SET NULL`. Indexed. |

Table check constraint `embed_project_target_check` enforces `num_nonnulls(model_id, scene_id) = 1` — every project references **exactly one** of model or scene. Service-level guards re-assert this on create / update.

`OneToMany` relation `domains` to `EmbedDomainWhitelistEntity`.

### `embed.embed_domain_whitelist` — [embed-domain-whitelist.entity.ts](../src/database/entities/embed/embed-domain-whitelist.entity.ts)

`EmbedDomainWhitelistEntity extends IntIdBaseEntity` (auto-increment `id`).

| Column | Type | Notes |
|---|---|---|
| `domain` | `text` | Hostname only — no protocol, no path. Optional port allowed. Validated by `DomainAddRequestDto` regex. |
| `embed_project_id` | `uuid`, FK → `embed.embed_project` | `ON DELETE CASCADE`. Indexed. |

### `embed.model_view_log` — [model-view-log.entity.ts](../src/database/entities/embed/model-view-log.entity.ts)

`ModelViewLogEntity extends IntIdBaseEntity`.

| Column | Type | Notes |
|---|---|---|
| `origin` | `text`, nullable | Raw `Origin` header value as supplied by the browser |
| `duration_seconds` | `integer`, nullable | Reserved; not currently written by the server |
| `model_id` | `uuid`, FK → `model_3d.model_3d` | `ON DELETE CASCADE`. Indexed. **NOT NULL** — see "View Logging" below. |
| `embed_project_id` | `uuid`, FK → `embed.embed_project`, nullable | `ON DELETE SET NULL`. Indexed. |

There is no IP or user-agent column on the row — only `origin` is captured.

---

## API Key Trust Model

Defined in [api-key.constants.ts](../src/modules/api-keys/api-key.constants.ts):

```ts
export const ApiKeyScopes = ['embed:read', 'read:models', 'read:scenes'] as const;
```

### Generation and storage

[`ApiKeyService.generate`](../src/modules/api-keys/services/api-key.service.ts) constructs a key with:

```
randomPart = randomBytes(32).toString('base64url')   // 32 random bytes → ~43 chars base64url
prefix     = randomPart.substring(0, 8)              // stored verbatim in column `prefix`
rawKey     = `${prefix}_${randomPart}`               // returned to caller exactly once
keyHash    = sha256(rawKey).digest('hex')            // stored in column `key_hash`
```

The **raw key is returned only on the create response** (`ApiKeyResponseDto.rawKey`). Subsequent reads (`GET /api-keys`) return the entity without `rawKey`. There is no recovery path; callers must regenerate on loss.

### Transport

`ApiKeyGuard` reads the raw key from the **`x-api-key`** request header — see [api-key.guard.ts:19](../src/modules/api-keys/guards/api-key.guard.ts#L19). The header value is hashed with SHA-256 and compared to `key_hash`. The Authorization header is not consulted.

### Validity checks (in order, [api-key.guard.ts](../src/modules/api-keys/guards/api-key.guard.ts))

1. Header present and is a string → else `401 Unauthorized`.
2. Hash matches a row in `api_key` → else `401`.
3. `revoked_at` is null → else `401`.
4. `expires_at` is null OR in the future → else `401`.
5. If the route declares `@RequiredScope(scope)`, the row's `scopes[]` contains that scope → else `403 Forbidden` via `AppHttpException`.
6. On success: `last_used_at` is updated fire-and-forget; `request.apiKey` is assigned for handlers.

### Per-org scope

API keys are owned by an organisation (`api_key.org_id`). The embed viewer additionally checks that the project being loaded belongs to the same org as the key (`project.orgId === apiKey.orgId`) — else `403`. See [embed.service.ts:47](../src/modules/embed/services/embed.service.ts#L47).

### Scopes and what they gate

| Scope | Used by | Semantics |
|---|---|---|
| `embed:read` | `GET /api/embed/:targetId` (only enforcement site today) | Required to load the public viewer payload (model or scene). |
| `read:models` | Defined in `ApiKeyScopes`, **not yet referenced** by any `@RequiredScope(...)` decorator | Reserved for a future read-only models REST surface authenticated by API key. |
| `read:scenes` | Defined in `ApiKeyScopes`, **not yet referenced** by any `@RequiredScope(...)` decorator | Reserved for a future read-only scenes REST surface authenticated by API key. |

The `@RequiredScope` decorator is in [decorators/required-scope.decorator.ts](../src/modules/api-keys/decorators/required-scope.decorator.ts) and writes the metadata key `requiredApiKeyScope`. The guard reads it via `Reflector.getAllAndOverride`, falling through to a "no scope required" pass when the decorator is absent.

---

## Domain Whitelist

The whitelist is enforced **inside the service**, not in a guard. The viewer route calls `EmbedService.assertOriginAllowed(project, origin)` after the API key check — see [embed.service.ts:225](../src/modules/embed/services/embed.service.ts#L225).

Rules:

| Condition | Result |
|---|---|
| `Origin` header absent (`undefined`) | Pass — no enforcement (server-to-server use, direct fetch from cURL/native, etc.) |
| `Origin` header is not a parseable URL | `403 Forbidden` ("Invalid Origin header") |
| Project has zero whitelist rows | `403 Forbidden` ("Embed domain whitelist is not configured") — empty whitelist explicitly fails closed |
| Hostname of `Origin` matches some `domain` in the project's whitelist (exact, case-sensitive) | Pass |
| Otherwise | `403 Forbidden` ("Origin not in domain whitelist") |

Comparison is on `new URL(origin).hostname`, so the port and protocol of the Origin are stripped for the match. Stored domains are written verbatim from `DomainAddRequestDto.domain` and validated by regex `^[a-zA-Z0-9]([a-zA-Z0-9-.]*[a-zA-Z0-9])?(:[0-9]+)?$` — see [domain.add.request.dto.ts](../src/modules/embed/dto/domain.add.request.dto.ts).

The `Referer` header is **not** consulted — only `Origin`.

---

## Embed Project

Created via `POST /api/embed/projects` and returned via `EmbedProjectResponseDto`.

| Field | Source | Notes |
|---|---|---|
| `orgId` | request | Must be an org the user is at least `Editor` of |
| `name` | request, max 100 | |
| `modelId` / `sceneId` | request, exactly one | Service rejects if both or neither set |
| `autoRotate` | request, optional, default `false` | Forwarded to viewer payload |
| `brandingConfig` | update only — `BrandingConfigDto` | `{ logoUrl?, primaryColor?, showBadge }`; `primaryColor` matches `^#[0-9a-fA-F]{6}$` |
| `allowedOrigins` | derived from `domains` relation | Returned as `string[]` of domain names |

### Logo upload pipeline

`POST /api/embed/projects/:id/logo` accepts a multipart `file` field — see [embed.controller.ts:112](../src/modules/embed/controllers/embed.controller.ts#L112).

```
1. JwtAuthGuard validates the user's session (Roles: User)
2. FileInterceptor('file') reads the upload into memory (no destination)
3. EmbedService.uploadProjectLogo:
   a. Loads project + asserts org membership ≥ Editor
   b. FilesService.saveEmbedLogo(projectId, file) →
      FsFileStorageStrategy.saveEmbedLogo (or S3 strategy):
        path = <fsConfig.folders.embed>/<projectId>/logo<ext>
        i.e. server/files/embed/<projectId>/logo<ext>
   c. Sets brandingConfig.logoUrl = `/api/embed/projects/<projectId>/logo`
   d. Saves project, returns updated DTO
4. GET /api/embed/projects/:id/logo (Public, Cache-Control max-age=3600)
   - Reads server/files/embed/<projectId>/, picks the first file starting with "logo",
     streams it as StreamableFile.
```

Notes:

- The controller does **not** apply `FileSizeValidatorPipe` or `FileTypeValidatorPipe` — the 1 MB / image-MIME limits documented in [file-storage.md](file-storage.md#embed-logos) are not enforced at this code path. Validation is currently the caller's responsibility.
- The on-disk filename is `logo<ext>` (not `<projectId>.<ext>`); `<projectId>` is the directory name.
- Strategy selection follows `FilesService.getStrategyForOrg` — see [file-storage.md](file-storage.md).

---

## Public Embed Viewer Auth Flow

```
Browser on third-party site
    │
    │  GET /api/embed/<targetId>
    │  Header:  x-api-key: <rawKey>
    │  Header:  Origin: https://customer.com
    ▼
ThrottlerBehindProxyGuard          (rate limit per IP)
    │
    ▼
JwtAuthGuard                       skipped — handler is @Public()
    │
    ▼
ApiKeyGuard  (per-route, via @UseGuards)
    │  - sha256(rawKey) → lookup api_key.key_hash
    │  - reject if not found / revoked / expired
    │  - @RequiredScope('embed:read') → assert scope present
    │  - update last_used_at fire-and-forget
    │  - attach request.apiKey
    ▼
EmbedController.getEmbedViewer
    │
    ▼
EmbedService.getEmbedViewer(targetId, apiKey, origin)
    │  1. embedProjectRepository.findByModelOrScene(targetId)
    │     → 404 if no project references that target
    │  2. assert project.orgId === apiKey.orgId (else 403)
    │  3. assertOriginAllowed(project, origin)
    │     → 403 if whitelist empty, hostname not allowed, or Origin malformed
    │  4. branch on which target the project references:
    │     - model:  Model3dService.get3DModel + viewLogRepository.createLog
    │     - scene:  ScenesService.getSceneForEmbed (no view log written)
    │  5. EmbedMapper.toViewer{Model,Scene}Response → EmbedViewerResponseDto
    ▼
{ type, model? | scene?, modelId? | sceneId?, brandingConfig, autoRotate, allowedOrigins }
```

Routing note: `GET :targetId` is declared **last** on `EmbedController` so that `projects`, `projects/:id/...`, and the logo routes are matched before falling through to the public viewer.

The scene branch deliberately bypasses scene visibility checks — see the comment at [embed.service.ts:60](../src/modules/embed/services/embed.service.ts#L60): *"Scene visibility is bypassed: API key + domain whitelist are the auth surface for embeds."*

---

## View Logging

Successful **model** loads write a `model_view_log` row via `ModelViewLogRepository.createLog(projectId, modelId, origin)` — see [embed.service.ts:55](../src/modules/embed/services/embed.service.ts#L55). The save is fire-and-forget; failures are logged at error level but do not affect the viewer response.

Recorded fields:

| Field | Source |
|---|---|
| `embed_project_id` | The matched embed project |
| `model_id` | `project.modelId` (NOT NULL — required by entity FK) |
| `origin` | The raw `Origin` header (may be null when absent) |
| `created_at` | `now()` via `IntIdBaseEntity` |

Not recorded: IP address, User-Agent, Referer, view duration. `duration_seconds` exists on the schema but is never set by the current codebase.

**Scene loads do NOT write a view log row** — `model_view_log.model_id` is NOT NULL, so scene-only embeds are out of scope until a separate analytics table is added (noted in [embed.service.ts:62](../src/modules/embed/services/embed.service.ts#L62)).

### Analytics queries

`ModelViewLogRepository` exposes three aggregations consumed by `GET /api/embed/projects/:id/analytics`:

| Method | Query | Returns |
|---|---|---|
| `getDailyViews(projectId, days = 30)` | `GROUP BY DATE(created_at)` over the last 30 days | `[{ date: 'YYYY-MM-DD', count }]` |
| `getTopOrigins(projectId, limit = 10)` | `GROUP BY origin` where origin IS NOT NULL, ordered by count desc | `[{ origin, count }]` |
| `getTotalViews(projectId)` | `count` over all rows for the project | `number` |

Composed into `ViewAnalyticsResponseDto` by `EmbedMapper.toAnalyticsResponse`.

---

## Endpoints

### `EmbedController` — `/api/embed`

[embed.controller.ts](../src/modules/embed/controllers/embed.controller.ts)

| Method + Path | Auth | Roles / Scope | Purpose |
|---|---|---|---|
| `POST /api/embed/projects` | JWT | `User` | Create an embed project (model XOR scene), Editor required on org |
| `GET /api/embed/projects?orgId=` | JWT | `User` | List embed projects in an org, Viewer required on org |
| `PATCH /api/embed/projects/:id` | JWT | `User` | Update name / target / autoRotate / brandingConfig, Editor required |
| `POST /api/embed/projects/:id/domains` | JWT | `User` | Add a domain to the project's whitelist, Editor required |
| `DELETE /api/embed/projects/:id/domains/:domain` | JWT | `User` | Remove a whitelist entry (hard delete), Editor required |
| `GET /api/embed/projects/:id/analytics` | JWT | `User` | Daily views + top origins + total, Viewer required |
| `POST /api/embed/projects/:id/logo` | JWT | `User` | Multipart logo upload, Editor required, sets `brandingConfig.logoUrl` |
| `GET /api/embed/projects/:id/logo` | **`@Public()`** | — | Stream the project logo, `Cache-Control: max-age=3600` |
| `GET /api/embed/:targetId` | **`@Public()` + `@UseGuards(ApiKeyGuard)` + `@RequiredScope('embed:read')`** | — | Public viewer payload — see auth flow above |

`targetId` may be either a `model_3d.id` or a `scene.id`; the route resolves whichever the project references.

### `ApiKeyController` — `/api/api-keys`

[api-key.controller.ts](../src/modules/api-keys/controllers/api-key.controller.ts)

| Method + Path | Auth | Roles / Scope | Purpose |
|---|---|---|---|
| `POST /api/api-keys` | JWT | (no `@Roles` — any authenticated user) | Generate a new key; response includes `rawKey` **once**. Body: `{ orgId, name, scopes[] }`. |
| `GET /api/api-keys?orgId=` | JWT | (no `@Roles`) | List keys for the org; `rawKey` is never returned here. |
| `DELETE /api/api-keys/:id?orgId=` | JWT | (no `@Roles`) | Revoke the key (sets `revoked_at = now()`). The (id, orgId) pair is required for the lookup; mismatched orgs result in `404 NotFoundException`. |

The controller does not apply org-membership / role checks; ownership is enforced only by the `(id, orgId)` filter on revoke. There is no `@RequiredScope` on these routes — they sit behind the global `JwtAuthGuard`, not `ApiKeyGuard`.

---

## Cross-references

- [auth.md](auth.md) — Global `JwtAuthGuard`, `@Public()`, `@Roles()`, session lifecycle. The embed viewer route opts out of JWT (`@Public()`) and substitutes `ApiKeyGuard`; every other route in `EmbedController` and `ApiKeyController` keeps the global JWT.
- [organizations.md](organizations.md) — API keys, embed projects, and view logs are all org-scoped via `org_id` (CASCADE on org deletion). Editor / Viewer role gates on every project mutation come from `OrgMemberRepository.findByOrgAndUser` plus `OrgMemberRoleWeights`.
- [file-storage.md](file-storage.md) — Logo upload goes through `FilesService.saveEmbedLogo` and the per-org strategy. Note the on-disk layout used by `EmbedService.streamProjectLogo` is `files/embed/<projectId>/logo<ext>`, not the `files/embed/logos/<projectId>.<ext>` path listed in that doc.
- [model-3d.md](model-3d.md) — When `embed_project.model_id` is set, the viewer payload comes from `Model3dService.get3DModel` and a `model_view_log` row is written per load.
- [scenes.md](scenes.md) — When `embed_project.scene_id` is set, the viewer payload comes from `ScenesService.getSceneForEmbed`. Scene visibility checks are bypassed (API key + domain whitelist are the trust surface). No view log is written for scene loads today.
