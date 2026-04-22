# MeshHub B2B Platform — Implementation Plan

> **Context:** MeshHub is transformed from a personal 3D model sharing tool into a full B2B SaaS platform combining three product directions: **Viewer as a Service**, **Private Asset Hub**, and **Product Configurator**.

---

## Architecture Overview

```
Organization (billing unit)
├── Workspaces (model collections with team access)
│   ├── Models (3D assets with versions, annotations, review comments)
│   └── Members (viewer / editor / admin roles)
├── Embed Projects (publish models to external websites)
│   ├── Domain Whitelist
│   ├── Branding Config
│   ├── Access Tokens (temporary sharing)
│   └── View Analytics
├── API Keys (machine-to-machine auth)
│   └── Webhooks (push events to client endpoints)
└── Subscription (seats, storage quota, views quota)
```

---

## Phase 0 — Foundation (estimated: 6 weeks)

> Everything downstream depends on this. Must be completed before any feature work.

### 0.1 Database — New Schemas & Constants

**File:** `server/src/database/constants.ts`

Add new schema and table constants:

```ts
export const DatabaseSchemas = {
  ...existing,
  Organizations: 'organizations',
  Workspaces:    'workspaces',
  Embed:         'embed',
} as const;

export const OrganizationSchemaTables = {
  Organization:    'organization',
  OrgSubscription: 'org_subscription',
  OrgMember:       'org_member',
  OrgInvite:       'org_invite',
  OrgAuditLog:     'org_audit_log',
} as const;

export const WorkspaceSchemaTables = {
  Workspace:       'workspace',
  WorkspaceMember: 'workspace_member',
} as const;

export const EmbedSchemaTables = {
  EmbedProject:        'embed_project',
  EmbedDomainWhitelist: 'embed_domain_whitelist',
} as const;

// Extend Models3DSchemaTables:
export const Models3DSchemaTables = {
  ...existing,
  ModelVersion:        'model_3d_version',
  ModelAnnotation:     'model_3d_annotation',
  ModelComment:        'model_3d_comment',
  ModelTag:            'model_3d_tag',
  ModelViewLog:        'model_3d_view_log',
  ModelDownloadToken:  'model_3d_download_token',
  MaterialVariantGroup: 'material_variant_group',
  MaterialVariant:     'material_variant',
  ConfiguratorPreset:  'configurator_preset',
} as const;

// Extend AuthSchemaTables:
export const AuthSchemaTables = {
  ...existing,
  ApiKey: 'api_key',
} as const;
```

### 0.2 Database — Init Scripts

**Directory:** `server/src/database/init/`

Add schema creation SQL files for new schemas (mirroring existing pattern):
- `organizations.sql` — `CREATE SCHEMA IF NOT EXISTS organizations;`
- `workspaces.sql` — `CREATE SCHEMA IF NOT EXISTS workspaces;`
- `embed.sql` — `CREATE SCHEMA IF NOT EXISTS embed;`

### 0.3 Entities — Organizations

**Directory:** `server/src/database/entities/organizations/`

Files to create:
- `organization.entity.ts` — name, domain, logoUrl, planType; extends `GuidIdEntityBase`
- `org-subscription.entity.ts` — orgId, planType (`starter|growth|scale|enterprise`), seatsLimit, viewsLimit (monthly), storageLimitBytes, renewsAt
- `org-member.entity.ts` — orgId, userId, role (`owner|admin|editor|viewer`)
- `org-invite.entity.ts` — orgId, email, role, token (UUID), expiresAt, acceptedAt
- `org-audit-log.entity.ts` — orgId, actorUserId, actorApiKeyId, action (string), targetType, targetId, metadata (json), ip, createdAt; extends `IntIdBaseEntity`

### 0.4 Entities — Workspaces

**Directory:** `server/src/database/entities/workspaces/`

Files to create:
- `workspace.entity.ts` — orgId, name, description; extends `GuidIdEntityBase`
- `workspace-member.entity.ts` — workspaceId, userId, role (`admin|editor|viewer`)

### 0.5 Entities — API Keys

**File:** `server/src/database/entities/session/api-key.entity.ts`

Fields: orgId, name, keyHash (SHA-256 of raw key, never stored plain), prefix (first 8 chars for display), lastUsedAt, expiresAt, revokedAt; extends `GuidIdEntityBase`

> **Security:** Raw key is shown once on creation. Only the SHA-256 hash is persisted.

### 0.6 Entities — Model3d Extensions

**File:** `server/src/database/entities/models-3d/model-3d.entity.ts` — add columns:
- `workspaceId` — nullable UUID FK → workspace
- `visibility` — enum `public | private | unlisted` (default `public`)
- `accessPasswordHash` — nullable text (for unlisted + password protected)

**New entity files:**

`model-3d-version.entity.ts` — modelId, fileId (FK to model_3d_file), versionNumber (int), changelog, createdByUserId

`model-3d-annotation.entity.ts` — modelId, label, body (text), posX/Y/Z (float), cameraPosX/Y/Z/AzimuthAngle/PolarAngle, order (int)

`model-3d-comment.entity.ts` — modelId, authorId, body (text), posX/Y/Z (float), resolved (bool, default false), parentId (nullable UUID self-ref)

`model-3d-tag.entity.ts` — modelId, name; extends `IntIdBaseEntity`

`model-3d-view-log.entity.ts` — modelId, apiKeyId (nullable), embedProjectId (nullable), origin, userAgent, durationSeconds, createdAt; extends `IntIdBaseEntity`

`model-3d-download-token.entity.ts` — modelId, token (UUID), expiresAt, maxViews (nullable int), usedViews (int), createdByUserId

`material-variant-group.entity.ts` — modelId, meshName, label, type (`color|texture`), order (int)

`material-variant.entity.ts` — groupId, label, hexColor (nullable), textureFileName (nullable), order (int)

`configurator-preset.entity.ts` — modelId, savedByUserId (nullable), variantsJson (json), shareToken (UUID unique), createdAt

### 0.7 Entities — Embed

**Directory:** `server/src/database/entities/embed/`

`embed-project.entity.ts` — orgId, modelId, name, apiKeyId, brandingConfig (json: `{primaryColor, logoUrl, showMeshHubBadge, theme}`), autoRotate (bool), autoRotateSpeed (float), backgroundAlpha (float)

`embed-domain-whitelist.entity.ts` — embedProjectId, domain (text); extends `IntIdBaseEntity`

### 0.8 Migrations — Phase 0

Generate migrations after all entities are created:

```bash
# Windows
npm run migration:generate:win --schema=organizations --name=CreateOrganizations
npm run migration:generate:win --schema=workspaces --name=CreateWorkspaces
npm run migration:generate:win --schema=auth --name=AddApiKey
npm run migration:generate:win --schema=model_3d --name=AddWorkspaceAndVisibility
npm run migration:generate:win --schema=model_3d --name=AddVersionsAnnotationsComments
npm run migration:generate:win --schema=model_3d --name=AddTagsViewLogDownloadToken
npm run migration:generate:win --schema=model_3d --name=AddConfiguratorTables
npm run migration:generate:win --schema=embed --name=CreateEmbedTables
```

### 0.9 Backend — Organizations Module

**Directory:** `server/src/modules/organizations/`

```
organizations/
├── organizations.module.ts
├── controllers/
│   ├── organization.controller.ts      — POST /, GET /current, PATCH /:id, DELETE /:id
│   └── org-members.controller.ts       — GET /:id/members, POST /:id/invite,
│                                          PATCH /:id/members/:uid, DELETE /:id/members/:uid
├── services/
│   ├── organization.service.ts
│   ├── org-invite.service.ts           — token generation, email via NotificationsModule
│   └── org-subscription.service.ts     — checkQuota(orgId, type): throws if limit exceeded
├── repositories/
│   ├── organization.repository.ts
│   ├── org-member.repository.ts
│   └── org-invite.repository.ts
├── mappers/
│   └── organization.mapper.ts
├── guards/
│   └── org-member.guard.ts             — requires OrgMemberRole metadata, checks org_member table
└── dto/
    ├── organization.response.dto.ts
    ├── organization.create.request.dto.ts
    ├── org-member.response.dto.ts
    └── org-invite.request.dto.ts
```

**`org-member.guard.ts` logic:**
1. Read `orgId` from route param.
2. Read `userId` from `req.session`.
3. Query `org_member` where `orgId + userId`.
4. Compare `member.role` against `@OrgMemberRole(...)` metadata.
5. Attach `member` to `req` for use in controllers.

### 0.10 Backend — API Keys Module

**Directory:** `server/src/modules/api-keys/`

```
api-keys/
├── api-keys.module.ts
├── api-keys.controller.ts       — POST /api-keys, GET /api-keys, DELETE /api-keys/:id
├── api-keys.service.ts          — generate raw key → store SHA-256 hash
├── api-key.repository.ts
├── guards/
│   └── api-key.guard.ts         — reads X-Api-Key header, hashes it, looks up in DB
└── dto/
    ├── api-key.response.dto.ts  — id, name, prefix, lastUsedAt, expiresAt (NO hash)
    └── api-key-created.response.dto.ts — extends response + rawKey (shown once)
```

**`api-key.guard.ts` logic:**
1. Check for `X-Api-Key` header. If absent — skip (let `JwtAuthGuard` handle).
2. Hash header value with SHA-256.
3. Find `ApiKeyEntity` where `keyHash` matches and `revokedAt IS NULL`.
4. Check `expiresAt` if set.
5. Update `lastUsedAt`.
6. Attach `req.apiKey` and `req.organization`.

**`jwt-auth.guard.ts` — modify:**
- If `req.headers['x-api-key']` present → skip JWT processing, let `ApiKeyGuard` run first.
- Add `@SkipJwt()` decorator for routes that only accept API key auth.

### 0.11 Backend — Workspaces Module

**Directory:** `server/src/modules/workspaces/`

```
workspaces/
├── workspaces.module.ts
├── controllers/workspace.controller.ts  — CRUD workspaces, manage workspace members
├── services/workspace.service.ts
├── repositories/workspace.repository.ts
├── mappers/workspace.mapper.ts
└── dto/
    ├── workspace.response.dto.ts
    └── workspace.create.request.dto.ts
```

Endpoints:
- `POST /workspaces` — create workspace (requires org admin)
- `GET /workspaces` — list my workspaces (across all orgs I'm member of)
- `GET /workspaces/:id` — get workspace details
- `PATCH /workspaces/:id` — rename (workspace admin)
- `DELETE /workspaces/:id` — soft delete (workspace admin)
- `POST /workspaces/:id/members` — add member
- `DELETE /workspaces/:id/members/:uid` — remove member

### 0.12 Backend — model_3d extensions

Add `workspaceId` FK and `visibility` to `Model3dEntity`.

Modify `Model3dRepository.findMany()` to filter by:
- `workspaceId` (if provided)
- `visibility = 'public'` for unauthenticated requests
- Skip visibility filter for workspace members

Modify `Model3dService.get3DModel()` to check access:
1. If `visibility = 'public'` → allow
2. If `visibility = 'private'` → require authenticated user who is workspace member
3. If `visibility = 'unlisted'` → allow if has URL, block if password set without matching header

### 0.13 Frontend — Phase 0

**New RTK Query tags** in `src/app/api/tags.ts`:
```ts
Organization:       'Organization',
OrgMembers:         'OrgMembers',
Workspaces:         'Workspaces',
WorkspaceMembers:   'WorkspaceMembers',
ApiKeys:            'ApiKeys',
```

**New API modules:**
- `src/app/api/organizations.ts` — CRUD orgs, members, invites
- `src/app/api/workspaces.ts` — CRUD workspaces, members
- `src/app/api/api-keys.ts` — CRUD API keys

**New Redux slice** `src/entities/organization/store/reducer.ts`:
```ts
{
  currentOrgId: string | null,
  currentWorkspaceId: string | null,
}
```
Persisted to localStorage under key `@mesh_hub/org`.

**New widget** `widgets/OrgSwitcher/` — dropdown in Header showing orgs + workspaces

**New pages:**
- `pages/OrgCreate/` — onboarding form (org name, domain)
- `pages/OrgDashboard/` — overview: models count, members, quota bars, recent activity

---

## Phase 1 — Viewer SaaS MVP (estimated: 4 weeks)

> Depends on Phase 0.

### 1.1 Backend — Embed Module

**Directory:** `server/src/modules/embed/`

```
embed/
├── embed.module.ts
├── controllers/
│   ├── embed-projects.controller.ts      — CRUD embed projects (auth: JWT + OrgMemberGuard)
│   └── embed-viewer.controller.ts        — @Public(), serves embed data
├── services/
│   ├── embed-projects.service.ts
│   └── embed-analytics.service.ts        — writes to model_3d_view_log
├── repositories/
│   └── embed-project.repository.ts
├── mappers/embed-project.mapper.ts
└── dto/
    ├── embed-project.response.dto.ts
    ├── embed-project.create.request.dto.ts
    └── embed-viewer-data.response.dto.ts  — model data + branding config
```

**Key endpoints:**

`GET /embed/:modelId` — `@Public()`
- Validates `X-Api-Key` header via `ApiKeyGuard`
- Checks `Origin` header against `embed_domain_whitelist`
- Records view in `model_3d_view_log` (async, non-blocking)
- Checks views quota via `OrgSubscriptionService.checkQuota()`
- Returns `EmbedViewerDataResponseDto` (model file URL, branding config, annotations)

`POST /embed/projects` — create embed project
`GET /embed/projects` — list org's embed projects
`PATCH /embed/projects/:id` — update branding config
`POST /embed/projects/:id/domains` — add allowed domain
`DELETE /embed/projects/:id/domains/:domain` — remove domain
`GET /embed/projects/:id/analytics` — view stats (daily views, unique origins)

**`embed-analytics.service.ts`:**
- `recordView(params)` — INSERT into `model_3d_view_log` (fire-and-forget)
- `getViewsByDay(embedProjectId, days)` — GROUP BY date aggregation
- `getTopOrigins(embedProjectId)` — GROUP BY origin

### 1.2 Backend — Access Tokens

**Endpoints on `model-3d.controller.ts`:**
- `POST /models-3d/:id/access-token` — body: `{ expiresIn, maxViews }`, returns `{ token, url }`
- Validate access token on `GET /embed/:modelId?token=xxx`

**`model-3d-download-token.entity.ts`** — already defined in Phase 0.

### 1.3 Frontend — EmbedViewer Page

**`src/pages/EmbedViewer/`** — standalone page, no shared Layout:

```
EmbedViewer/
├── index.tsx                  — lazy route at /embed/:modelId
├── EmbedViewer.tsx            — renders Model3DViewer only, applies branding
└── hooks/
    ├── useEmbedConfig.ts      — parses query params: ?theme=dark&bg=transparent&autoRotate=1
    └── useEmbedPostMessage.ts — window.addEventListener('message') → Viewer commands
```

Route registered outside the main `<Layout>` — no Header, no Footer.

**postMessage API (inbound commands from parent iframe):**
```ts
type EmbedCommand =
  | { type: 'RESET_CAMERA' }
  | { type: 'SET_BACKGROUND'; color: string }
  | { type: 'SET_AUTO_ROTATE'; speed: number }
  | { type: 'TAKE_SCREENSHOT' }  // → postMessage back: { type: 'SCREENSHOT', data: base64 }
  | { type: 'APPLY_MATERIAL_VARIANT'; meshName: string; color?: string; textureUrl?: string }
```

### 1.4 Frontend — EmbedProject Management

**`src/pages/EmbedProject/`:**

```
EmbedProject/
├── index.tsx                  — /org/:orgId/embed/:projectId
├── EmbedProject.tsx
└── components/
    ├── EmbedCodeGenerator.tsx — generates <iframe> snippet or JS SDK snippet
    ├── DomainWhitelist.tsx    — add/remove allowed domains
    ├── BrandingEditor.tsx     — color picker, logo upload, badge toggle
    └── ViewsChart.tsx         — last 30 days bar chart (uses recharts)
```

### 1.5 Frontend — OrgSettings Page

**`src/pages/OrgSettings/`:**

```
OrgSettings/
├── index.tsx                  — /org/:orgId/settings
└── tabs/
    ├── MembersTab.tsx         — list members, invite form, role selector, remove
    ├── ApiKeysTab.tsx         — list keys (prefix only), create (shows raw key once), revoke
    ├── BillingTab.tsx         — current plan, quota progress bars, Stripe portal link
    └── WebhooksTab.tsx        — registered webhook endpoints (Phase 3)
```

### 1.6 Frontend — Subscription Quota UI

**New widget `widgets/QuotaBar/`:**
```tsx
// Shows used/limit with color transitions:
// 0–60% → green, 60–80% → yellow, 80–100% → red
// Props: used, limit, unit ('views' | 'GB' | 'seats')
```

Used in: `OrgDashboard/QuotaWidget`, `OrgSettings/BillingTab`.

### 1.7 Stripe Integration (server-side only)

New env vars (add to `ConfigService`):
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER_MONTHLY
STRIPE_PRICE_GROWTH_MONTHLY
STRIPE_PRICE_SCALE_MONTHLY
```

**New module `server/src/modules/billing/`:**
```
billing/
├── billing.module.ts
├── billing.controller.ts     — POST /billing/checkout, POST /billing/portal,
│                               POST /billing/webhook (Stripe webhook receiver)
├── billing.service.ts        — createCheckoutSession(), createPortalSession(),
│                               handleWebhookEvent()
└── jobs/
    └── subscription-sync.job.ts  — Bull job: update org_subscription after Stripe event
```

Webhook events handled:
- `checkout.session.completed` → activate subscription
- `invoice.paid` → renew subscription, reset monthly views counter
- `invoice.payment_failed` → flag subscription, notify org admin via email
- `customer.subscription.deleted` → downgrade to free tier

---

## Phase 2 — Asset Hub MVP (estimated: 5 weeks)

> Depends on Phase 0. Can run in parallel with Phase 1.

### 2.1 Backend — Versions Module

**Directory:** `server/src/modules/versions/`

```
versions/
├── versions.module.ts
├── versions.controller.ts   — GET /models-3d/:id/versions,
│                               POST /models-3d/:id/versions (upload new),
│                               POST /models-3d/:id/versions/:versionId/restore
├── versions.service.ts      — copy current file → new version record, bump versionNumber
└── version.repository.ts
```

**`versions.service.ts` — upload new version flow:**
1. Save new file via `FilesService.save3DModel()`
2. Create `ModelVersionEntity` pointing to new file, incrementing `versionNumber`
3. Update `model_3d.file_id` to new file
4. Write audit log entry
5. Trigger webhook event `model.version.added` (Phase 3)

**`versions.service.ts` — restore flow:**
1. Find version by id
2. Update `model_3d.file_id` to version's `fileId`
3. Write audit log entry

### 2.2 Backend — Reviews Module

**Directory:** `server/src/modules/reviews/`

```
reviews/
├── reviews.module.ts
├── reviews.controller.ts    — GET /models-3d/:id/comments,
│                               POST /models-3d/:id/comments,
│                               PATCH /models-3d/:id/comments/:cid (resolve/edit),
│                               DELETE /models-3d/:id/comments/:cid
├── reviews.service.ts
└── review.repository.ts
```

**`model-3d-comment.entity.ts` DTO fields returned:**
- `id, modelId, authorId, authorName, authorAvatar, body, posX, posY, posZ, resolved, parentId, createdAt, updatedAt`

Access control:
- Read comments: workspace member (any role)
- Create comment: workspace member with `editor` or `admin` role
- Resolve/delete: comment author OR workspace admin

### 2.3 Backend — Annotations Module

**Directory:** `server/src/modules/annotations/`

```
annotations/
├── annotations.module.ts
├── annotations.controller.ts   — full CRUD, @Public() for GET (respects model visibility)
├── annotations.service.ts
└── annotation.repository.ts
```

Annotations are **public-facing** hotspots (displayed in embed). Reviews are **private** team comments. Both use xyz coordinates in the 3D scene, but serve different purposes.

### 2.4 Backend — Audit Log

**`org-audit-log.entity.ts`** — already defined in Phase 0.

Add `OrgAuditLogService` to `OrganizationsModule`:
- `log(params: AuditLogParams): Promise<void>` — called from other services
- `getLogs(orgId, pagination, filters): Promise<PaginationResponseDto<AuditLogEntryDto>>`

`AuditLogParams`:
```ts
interface AuditLogParams {
  orgId: string;
  actorUserId?: string;
  actorApiKeyId?: string;
  action: AuditAction;  // enum: model.upload | model.delete | model.version.restore | ...
  targetType?: 'model' | 'member' | 'api_key' | 'embed_project' | 'workspace';
  targetId?: string;
  metadata?: Record<string, any>;
  ip?: string;
}
```

**Endpoint:** `GET /organizations/:id/audit-log` — paginated, org admin only.

### 2.5 Frontend — Viewer Raycast (click → 3D position)

**File:** `src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`

Add method:
```ts
public onScenePointerDown(
  callback: (worldPosition: Vector3, meshName: string | null) => void
): () => void {
  // Set up Raycaster on canvas pointerdown event
  // Cast ray → find intersection with model meshes
  // Extract world position from intersection.point
  // Return cleanup function
}
```

**File:** `src/widgets/Model3DViewer/classes/World/World.ts`

Add methods:
```ts
public spawnMarker(id: string, position: Vector3, options: MarkerOptions): void
// Spawn a 3D marker (sprite or small sphere) at world position
// options: { color, layer, userData }

public removeMarker(id: string): void
// Find by userData.markerId and remove from scene

public getMeshNames(): string[]
// scene.traverse → collect all Mesh.name values (used by ConfiguratorEditor)
```

### 2.6 Frontend — ReviewPanel Widget

**`src/widgets/ReviewPanel/`:**
```
ReviewPanel/
├── index.tsx
├── ReviewPanel.tsx            — scrollable list of comments + add form
├── ReviewPanel.module.scss
└── components/
    ├── ReviewThread.tsx       — root comment + nested replies
    ├── ReviewComment.tsx      — single comment card (text, author, resolve button)
    └── ReviewMarkerLayer.tsx  — renders markers in viewer (uses World.spawnMarker)
```

**`useReviewPanel` hook** (inside ReviewPanel):
- Fetches comments via RTK Query `useModelCommentsQuery(modelId)`
- On new comment: calls `Viewer.onScenePointerDown()` to capture click position
- After position captured: opens inline form
- On submit: calls `useCreateModelCommentMutation()`
- Spawns marker in World after successful create
- On resolve: calls `useResolveModelCommentMutation()` → removes/grays marker

### 2.7 Frontend — AnnotationManager Widget

**`src/widgets/AnnotationManager/`:**
```
AnnotationManager/
├── index.tsx
├── AnnotationManager.tsx      — list + edit mode toggle
└── components/
    └── AnnotationCard.tsx     — label, body preview, "go to" button (flies camera)
```

Annotations also render in `EmbedViewer` page as clickable hotspots.

### 2.8 Frontend — VersionHistory Widget

**`src/widgets/VersionHistory/`:**
```
VersionHistory/
├── index.tsx
├── VersionHistory.tsx         — timeline list of versions
└── components/
    ├── VersionEntry.tsx       — version number, date, author, changelog, restore button
    └── UploadVersionForm.tsx  — file input + changelog textarea
```

### 2.9 Frontend — Editor Page Extensions

Add three collapsible right panels to `pages/Editor/`:
```
pages/Editor/components/
├── ...existing...
├── VersionPanel/              — wraps VersionHistory widget
├── ReviewPanel/               — wraps ReviewPanel widget
└── AnnotationPanel/           — wraps AnnotationManager widget
```

Panel toggle buttons in Editor Navbar. Only one panel open at a time.

---

## Phase 3 — Product Configurator MVP (estimated: 5 weeks)

> Depends on Phase 0. Can run in parallel with Phase 1 & 2.

### 3.1 Backend — Configurator Module

**Directory:** `server/src/modules/configurator/`

```
configurator/
├── configurator.module.ts
├── controllers/
│   ├── configurator.controller.ts        — CRUD material variant groups and variants
│   └── configurator-preset.controller.ts — save preset, get by shareToken (@Public for GET)
├── services/configurator.service.ts
├── repositories/configurator.repository.ts
├── mappers/configurator.mapper.ts
└── dto/
    ├── variant-group.response.dto.ts
    ├── variant-group.create.request.dto.ts
    ├── variant.response.dto.ts
    ├── variant.create.request.dto.ts      — hexColor XOR textureFile (multipart)
    └── configurator-preset.response.dto.ts
```

**Endpoints:**
- `GET    /models-3d/:id/variant-groups` — list groups (public if model is public)
- `POST   /models-3d/:id/variant-groups` — create group (editor/admin)
- `PATCH  /models-3d/:id/variant-groups/:gid` — rename, reorder
- `DELETE /models-3d/:id/variant-groups/:gid`
- `POST   /models-3d/:id/variant-groups/:gid/variants` — add variant (with optional texture upload)
- `PATCH  /models-3d/:id/variant-groups/:gid/variants/:vid` — edit
- `DELETE /models-3d/:id/variant-groups/:gid/variants/:vid`
- `POST   /models-3d/:id/configurator-presets` — save selected config
- `GET    /models-3d/:id/configurator-presets/:shareToken` — `@Public()`

**File storage** — add to `IFileStorageStrategy`:
```ts
saveVariantTexture(modelId: string, variantId: string, file: Express.Multer.File): Promise<string>
// → files/models-3d/<modelId>/variants/<variantId>.png
```

### 3.2 Frontend — applyMaterialVariant in World.ts

**File:** `src/widgets/Model3DViewer/classes/World/World.ts`

```ts
public applyMaterialVariant(
  meshName: string,
  options: { hexColor?: string; textureUrl?: string }
): Promise<void> {
  // 1. Find Mesh by name via scene.traverse
  // 2. Clone current material to avoid shared references
  // 3. If hexColor: set material.color = new Color(hexColor)
  // 4. If textureUrl: load via TextureLoader → set material.map
  // 5. material.needsUpdate = true
}
```

### 3.3 Frontend — ConfiguratorPanel Widget

**`src/widgets/ConfiguratorPanel/`:**
```
ConfiguratorPanel/
├── index.tsx
├── ConfiguratorPanel.tsx
├── ConfiguratorPanel.module.scss
└── components/
    ├── VariantGroup.tsx       — group label + swatch row
    └── VariantSwatch.tsx      — colored/textured tile, selected state ring
```

**`useConfigurator` hook** (inside ConfiguratorPanel):
```ts
// State: selectedVariants: Record<groupId, variantId>
// On swatch click:
//   1. Update selectedVariants state
//   2. Call viewer.world.applyMaterialVariant(group.meshName, variant)
// Save preset button:
//   1. POST /configurator-presets with current selectedVariants JSON
//   2. Show shareable URL with shareToken
```

Exposed from widget:
```ts
export type { ConfiguratorState } from './hooks/useConfigurator'
export function ConfiguratorPanel({ modelId, viewer }: ConfiguratorPanelProps) {}
```

### 3.4 Frontend — ConfiguratorEditor Page

**`src/pages/ConfiguratorEditor/`:**
```
ConfiguratorEditor/
├── index.tsx                  — /org/:orgId/models/:modelId/configurator
├── ConfiguratorEditor.tsx     — split layout: viewer (left) + editor (right)
└── components/
    ├── MeshSelector.tsx       — dropdown of getMeshNames() results
    ├── GroupForm.tsx          — name + type (color|texture) + meshName
    ├── VariantList.tsx        — swatches in edit mode (add/delete/reorder)
    └── PublishPanel.tsx       — embed code for configurator embed, share link
```

**Steps flow:**
1. Select mesh from `getMeshNames()` dropdown (highlights mesh in viewer)
2. Create variant group for that mesh
3. Add variants (color picker or texture upload)
4. Preview by clicking swatches → `applyMaterialVariant()` in real time
5. Publish → get embed code for `ConfiguratorEmbed` page

### 3.5 Frontend — ConfiguratorEmbed Page

**`src/pages/ConfiguratorEmbed/`:**
```
ConfiguratorEmbed/
├── index.tsx                  — /embed/:modelId/configurator (no Layout)
├── ConfiguratorEmbed.tsx      — Model3DViewer + ConfiguratorPanel side by side
└── hooks/
    └── usePresetLoader.ts     — if ?preset=TOKEN → load preset, apply variants on mount
```

---

## Phase 4 — Advanced B2B Features (estimated: ongoing)

### 4.1 Webhooks

**Directory:** `server/src/modules/webhooks/`

```
webhooks/
├── webhooks.module.ts
├── webhooks.controller.ts     — CRUD webhook endpoints
├── webhooks.service.ts        — dispatch(event, payload): enqueue Bull job
├── webhook.repository.ts
└── jobs/
    └── webhook-dispatch.job.ts — HTTP POST to client URL, HMAC-SHA256 signature,
                                   retry 3x with exponential backoff
```

**Event types dispatched:**
| Event | Trigger |
|---|---|
| `model.view` | View recorded in embed |
| `model.uploaded` | New model uploaded to workspace |
| `model.version.added` | New version uploaded |
| `comment.added` | New review comment created |
| `preset.saved` | Configurator preset saved |
| `quota.warning` | 80% of monthly views quota reached |
| `member.invited` | Org member invite sent |

**Webhook signature (security):**
```
X-MeshHub-Signature: sha256=HMAC(webhookSecret, JSON.stringify(payload))
```

**Frontend — `OrgSettings/WebhooksTab.tsx`:**
- List registered webhook URLs
- Add webhook form (URL + event type multiselect + secret)
- Test webhook button → POST dummy event
- Delivery log (last 20 attempts, status, response code)

### 4.2 Batch Upload API

**New endpoint group on `model-3d.controller.ts`:**
```
POST /models-3d/batch           — multipart, multiple files, returns { jobId }
GET  /models-3d/batch/:jobId    — { total, processed, failed, results[] }
```

**Auth:** `X-Api-Key` (API key auth) — batch upload is machine-to-machine.

**Bull job `batch-upload.job.ts`:**
- Process files sequentially (avoid I/O contention)
- Per-file: validate extension → save file → create entity → save thumbnail (auto-generate from file)
- Write progress to Redis key `batch:${jobId}:progress`
- Trigger `model.uploaded` webhook per successful file

**Frontend — `pages/OrgSettings/` → `BatchUpload` tab:**
- Drag-and-drop zone accepting multiple `.glb`/`.gltf` files
- Progress list (file name, status icon, error if failed)
- Polling `useGetBatchStatusQuery(jobId, { pollingInterval: 2000 })` until done

### 4.3 Model Search & Full-Text Tagging

**Database changes:**
- Add GIN index on `model_3d.name` and `model_3d.description` for PostgreSQL FTS
- `model_3d_tag` table already defined in Phase 0

**New endpoints:**
```
GET  /models-3d?q=sofa&tags=furniture,lowpoly&workspaceId=xxx
POST /models-3d/:id/tags         — add tag
DELETE /models-3d/:id/tags/:tag  — remove tag
```

**PostgreSQL FTS query:**
```sql
WHERE to_tsvector('english', name || ' ' || description::text) @@ plainto_tsquery('english', $1)
```

**Frontend — `widgets/Models3DList/` extensions:**
- Search input (debounced 300ms)
- Tag filter (multi-select combobox)
- Tags displayed as badges on model cards

### 4.4 Conversion Pipeline (FBX/OBJ → GLB)

**New module `server/src/modules/conversion/`:**

```
conversion/
├── conversion.module.ts
├── conversion.controller.ts     — POST /models-3d/convert
├── conversion.service.ts        — spawn child process
└── jobs/
    └── convert-model.job.ts     — runs Blender headless or assimp CLI
```

**Conversion flow:**
1. Upload source file (FBX/OBJ/DAE/STL) to `files/models-3d/temp/`
2. Enqueue Bull job `convert-model`
3. Job runs: `blender --background --python convert.py -- input.fbx output.glb`
4. On success: delete source file, call `Model3dService.upload3DModel()` with GLB
5. Update job status in Redis
6. Client polls `GET /models-3d/convert/:jobId`

**Accepted source formats:** `.fbx`, `.obj`, `.dae`, `.stl`, `.ply`

**Frontend — `widgets/Upload3DModelModal/` extensions:**
- Accept source formats in addition to GLB/GLTF
- Show conversion progress indicator
- Display warning: "Conversion may take a few minutes for large files"

### 4.5 Analytics Heatmap

**Extended `model_3d_view_log`** — add column `interactions JSONB`:
```ts
// Each interaction recorded during embed session:
interface Interaction {
  type: 'scene_click' | 'camera_stop' | 'variant_select';
  posX?: number; posY?: number; posZ?: number;
  azimuth?: number; polar?: number;
  variantGroupId?: string; variantId?: string;
  ts: number; // ms since session start
}
```

**`EmbedViewer` page** — collect interactions:
- `scene_click`: on every canvas click → Raycaster → world position
- `camera_stop`: when camera controls stop moving → capture spherical coords
- `variant_select`: when ConfiguratorPanel swatch clicked

Batch-send to `POST /embed/analytics/interactions` on page unload (`navigator.sendBeacon`).

**New endpoint:** `GET /models-3d/:id/analytics/heatmap`
- Returns aggregated click positions and top camera stops

**Frontend — `widgets/AnalyticsHeatmap/`:**
- Renders a top-down orthographic screenshot of model
- Overlays a canvas with gaussian-blurred dots at click positions
- Color scale: blue (few) → red (many clicks)

### 4.6 White-label Custom Domain

**Infrastructure (Nginx config):**
```nginx
server {
  server_name ~^embed\..+$  viewer.meshhub.com;

  location / {
    # Lookup embed_project by Host header
    # Pass to Node.js via header: X-Custom-Domain: $host
  }
}
```

**Backend middleware `custom-domain.middleware.ts`:**
1. Read `X-Custom-Domain` header (set by Nginx)
2. Query `embed_project` where `customDomain = host`
3. Attach `embedProject` to `req`
4. Route to `embed-viewer.controller.ts` with pre-resolved project

**Database:** Add `customDomain` column to `embed_project`.

**TLS:** Let's Encrypt with DNS challenge via ACME client (certbot or cert-manager in K8s).

**Frontend — `pages/EmbedProject/` → add `CustomDomainTab`:**
- Input for custom domain CNAME
- DNS verification instructions (show expected CNAME target)
- TLS status badge (pending / active / error)

---

## Phase 5 — Enterprise (estimated: ongoing)

### 5.1 SSO / SAML

**New module `server/src/modules/sso/`:**
- `passport-saml` or `samlify` integration
- `POST /auth/sso/:orgSlug` — SAML assertion endpoint
- Store SAML config (IdP metadata URL, entity ID, cert) in `org_subscription`
- Auto-provision users on first SSO login → create `org_member` with `viewer` role

**Frontend:**
- `OrgSettings/` → `SecurityTab` — SAML config form (IdP URL, cert upload)
- SSO login button on `/auth/login` if org slug in URL

### 5.2 Self-hosted / On-premise Packaging

- Docker Compose production template with all services
- Helm chart for Kubernetes deployment
- Offline license key validation (JWT signed with MeshHub private key)
- Config: disable external services (Stripe webhook → internal activation, email → SMTP config)

---

## New Environment Variables Summary

Add to `server/.env.example` and `ConfigService`:

```bash
# Organizations
ORG_INVITE_TOKEN_TTL_HOURS=48

# API Keys
API_KEY_HASH_ALGORITHM=sha256

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_GROWTH_MONTHLY=
STRIPE_PRICE_SCALE_MONTHLY=

# Webhooks
WEBHOOK_DISPATCH_MAX_RETRIES=3
WEBHOOK_DISPATCH_TIMEOUT_MS=10000

# Conversion
BLENDER_CLI_PATH=/usr/bin/blender
CONVERSION_JOB_TIMEOUT_MS=600000

# Feature flags (for gradual rollout)
FEATURE_CONFIGURATOR=false
FEATURE_BATCH_UPLOAD=false
FEATURE_WEBHOOKS=false
FEATURE_CONVERSION=false
```

---

## Plan Overview Table

| Phase | Feature | BE Modules | FE Pages/Widgets | Depends On | Effort |
|---|---|---|---|---|---|
| 0 | Organizations + API Keys + Workspaces | `organizations`, `api-keys`, `workspaces` | `OrgCreate`, `OrgDashboard`, `OrgSwitcher` | — | 6 wks |
| 1 | Viewer SaaS + Embed + Billing | `embed`, `billing` | `EmbedViewer`, `EmbedProject`, `OrgSettings` | Phase 0 | 4 wks |
| 2 | Asset Hub: Versions + Reviews + Annotations | `versions`, `reviews`, `annotations` | `VersionHistory`, `ReviewPanel`, `AnnotationManager` | Phase 0 | 5 wks |
| 3 | Product Configurator | `configurator` | `ConfiguratorPanel`, `ConfiguratorEditor`, `ConfiguratorEmbed` | Phase 0 | 5 wks |
| 4a | Webhooks | `webhooks` | `WebhooksTab` | Phase 1 | 2 wks |
| 4b | Batch Upload | `conversion` (partial) | `BatchUploadTab` | Phase 0 | 2 wks |
| 4c | Search & Tags | `models-3d` extension | `Models3DList` extension | Phase 0 | 1 wk |
| 4d | Format Conversion Pipeline | `conversion` | `Upload3DModelModal` extension | Phase 4b | 3 wks |
| 4e | Analytics Heatmap | `embed` extension | `AnalyticsHeatmap` widget | Phase 1 | 2 wks |
| 4f | White-label Domain | Nginx + middleware | `CustomDomainTab` | Phase 1 | 2 wks |
| 5 | SSO + Enterprise | `sso` | `SecurityTab` | Phase 1 | 4 wks |
