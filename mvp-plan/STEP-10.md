# STEP-10 — Embed Module (Backend)

**Block:** 3 — Embed Viewer
**Prerequisites:** STEP-9 (entities + API key guard)
**Parallel with:** STEP-12 (reviews backend)

---

## Goal

Implement the `embed` NestJS module: embed project management, public viewer endpoint
with API key + origin validation, view logging, and analytics.

---

## Directory Structure

```
server/src/modules/embed/
├── embed.module.ts
├── controllers/
│   └── embed.controller.ts
├── services/
│   └── embed.service.ts
├── repositories/
│   ├── embed-project.repository.ts
│   ├── embed-domain-whitelist.repository.ts
│   └── model-view-log.repository.ts
├── mappers/
│   └── embed.mapper.ts
└── dto/
    ├── embed-project.create.request.dto.ts
    ├── embed-project.update.request.dto.ts
    ├── embed-project.response.dto.ts
    ├── embed-viewer.response.dto.ts
    ├── view-analytics.response.dto.ts
    └── domain.add.request.dto.ts
```

---

## DTOs

### `embed-project.create.request.dto.ts`

Fields: `orgId: string` (@IsUUID), `name: string` (@MaxLength(100)),
`modelId?: string` (@IsUUID, @IsOptional), `autoRotate?: boolean`.

### `embed-project.update.request.dto.ts`

Fields: all optional — `name?`, `modelId?`, `autoRotate?`, `brandingConfig?`.

`brandingConfig` DTO:
```ts
class BrandingConfigDto {
  @IsOptional() @IsUrl() logoUrl?: string;
  @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/) primaryColor?: string;
  @IsBoolean() showBadge: boolean;
}
```

### `embed-viewer.response.dto.ts`

What the public embed endpoint returns:
```ts
{
  model: Model3DResponseDto,
  brandingConfig: BrandingConfig,
  autoRotate: boolean,
  allowedOrigins: string[],
}
```

### `view-analytics.response.dto.ts`

```ts
{
  dailyViews: { date: string, count: number }[],  // last 30 days
  topOrigins: { origin: string, count: number }[], // top 10
  totalViews: number,
}
```

---

## Service: `EmbedService`

### `getEmbedViewer(modelId, apiKey, origin)`

Called from the `@Public()` embed endpoint:

1. Look up the `EmbedProject` by `modelId` (one model → one embed project on MVP;
   if multiple projects share a model, use the one matching the API key's org).
2. Validate the API key belongs to the same org as the embed project.
3. If `origin` is provided (from `Origin` request header): validate it against
   `EmbedDomainWhitelistEntity` for this project.
   - If whitelist is empty → reject all origins (not yet configured).
   - If `origin` matches any whitelisted domain → allow.
   - Otherwise → throw `ForbiddenException`.
4. Load model via `Model3dService.get3DModel(modelId)`.
5. Log view: create `ModelViewLogEntity` (fire-and-forget).
6. Return `EmbedViewerResponseDto`.

### `createProject(user, dto)`

Verify user is org member (role ≥ editor). Create `EmbedProjectEntity`.

### `listProjects(user, orgId)`

Return all projects for the org. Verify membership.

### `updateProject(projectId, user, dto)`

Verify membership. Apply patch. Return updated DTO.

### `addDomain(projectId, user, domain)`

Add `EmbedDomainWhitelistEntity`. Validate domain format (no protocol, no path).

### `removeDomain(projectId, user, domain)`

Hard-delete the domain row (not soft-delete — whitelist entries have no history value).

### `getAnalytics(projectId, user)`

```sql
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS count
FROM embed.model_view_log
WHERE embed_project_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date ASC;
```

Top origins: GROUP BY `origin` ORDER BY count DESC LIMIT 10.

---

## Controller: `EmbedController`

Prefix: `/embed`.

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/:modelId` | `@Public()` + `ApiKeyGuard` | Public viewer data |
| POST | `/projects` | `@Roles([User])` | Create project |
| GET | `/projects` | `@Roles([User])` | List projects (query `?orgId=`) |
| PATCH | `/projects/:id` | `@Roles([User])` | Update project |
| POST | `/projects/:id/domains` | `@Roles([User])` | Add domain |
| DELETE | `/projects/:id/domains/:domain` | `@Roles([User])` | Remove domain |
| GET | `/projects/:id/analytics` | `@Roles([User])` | View analytics |

**`GET /embed/:modelId`** details:
- Decorate with `@Public()` — JwtAuthGuard skips it.
- Apply `@UseGuards(ApiKeyGuard)` — validates `X-Api-Key` header.
- Extract `Origin` header from request for domain check.
- Return `EmbedViewerResponseDto`.

---

## Module Registration

**`embed.module.ts`:**
```ts
imports: [
  TypeOrmModule.forFeature([EmbedProjectEntity, EmbedDomainWhitelistEntity, ModelViewLogEntity]),
  ApiKeysModule,      // for ApiKeyGuard
  Models3dModule,     // for Model3dService (or Model3dMapper)
  OrganizationsModule, // for OrgMemberRepository
],
```

**`app.module.ts`:** Import `EmbedModule`.

---

## Verification

1. `GET /api/embed/<modelId>` with valid `X-Api-Key` and valid `Origin` → 200 with model data.
2. Same request with invalid origin → 403.
3. Same request without `X-Api-Key` → 401.
4. `GET /api/embed/projects/:id/analytics` → returns `dailyViews` array.
5. Each successful embed view creates a row in `embed.model_view_log`.
