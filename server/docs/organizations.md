# Organizations, Workspaces, Webhooks

## Scope

The org/workspace surface implements multi-tenancy for MeshHub. Every resource (model, scene, embed project, file) is owned by an organization. Each organization has a per-tenant subscription record (`org_subscription`) that defines seat limits, storage quota, storage backend (local vs S3), and per-tenant S3 credentials encrypted at rest. Inside an organization, work is partitioned into workspaces — a workspace is the scope a scene/model is created under, and each workspace has its own member list (a subset of the org's members). Access is gated by a hierarchical role system at the org level (`Owner > Admin > Editor > Viewer`) plus a flat role at the workspace level (`Editor | Viewer`). Outbound integration is delivered through HMAC-signed webhooks dispatched via a Bull queue.

---

## Entities & Schema

All organizations-related tables live in the `organizations` schema; workspace tables live in the `workspaces` schema. Schema/table constants are in [database/constants.ts](../src/database/constants.ts) (`OrganizationsSchemaTables`, `WorkspacesSchemaTables`). All entities extend `GuidIdEntityBase` (UUID `id`, `createdAt`, `updatedAt`, `deletedAt`).

### Organizations schema

| Entity | Table | Key fields | FKs | Notes |
|---|---|---|---|---|
| `OrganizationEntity` | `organization` | `name`, `slug` (unique), `planType` (enum) | — | [organization.entity.ts](../src/database/entities/organizations/organization.entity.ts). `PlanType` ∈ {`starter`, `growth`, `enterprise`}; defaults to `starter`. |
| `OrgMemberEntity` | `org_member` | `role` (enum), `orgId`, `userId` | `org_id → organization`, `user_id → user` (both `ON DELETE CASCADE`) | [org-member.entity.ts](../src/database/entities/organizations/org-member.entity.ts). Unique `(orgId, userId)`. Indexed on `userId`. |
| `OrgInviteEntity` | `org_invite` | `invitedEmail`, `role`, `token` (uuid, unique), `expiresAt`, `acceptedAt` (nullable), `orgId` | `org_id → organization` (CASCADE) | [org-invite.entity.ts](../src/database/entities/organizations/org-invite.entity.ts). Indexed on `orgId`. |
| `OrgSubscriptionEntity` | `org_subscription` | `storageLimitBytes` (bigint, nullable), `seatsLimit` (int, nullable), `storageBackend` (enum), `storageConfigEncrypted` (text, nullable), `orgId` (unique) | `org_id → organization` (CASCADE, OneToOne) | [org-subscription.entity.ts](../src/database/entities/organizations/org-subscription.entity.ts). One row per org. Null limits = unbounded. |
| `WebhookEntity` | `webhook` | `orgId`, `url`, `events` (text[]), `secret` (varchar 255, AES-encrypted), `isActive` (bool, default true) | `org_id → organization` (CASCADE) | [webhook.entity.ts](../src/database/entities/organizations/webhook.entity.ts). Indexed on `orgId`. Soft-delete supported. |
| `WebhookDeliveryLogEntity` | `webhook_delivery_log` | `webhookId`, `event` (varchar 50), `payload` (jsonb), `responseStatus` (int, nullable), `deliveredAt` (nullable), `failedAt` (nullable) | `webhook_id → webhook` (CASCADE) | [webhook-delivery-log.entity.ts](../src/database/entities/organizations/webhook-delivery-log.entity.ts). Indexed on `webhookId`. |

### Workspaces schema

| Entity | Table | Key fields | FKs | Notes |
|---|---|---|---|---|
| `WorkspaceEntity` | `workspace` | `name`, `orgId` | `org_id → organization` (CASCADE) | [workspace.entity.ts](../src/database/entities/workspaces/workspace.entity.ts). |
| `WorkspaceMemberEntity` | `workspace_member` | `role` (enum), `workspaceId`, `userId` | `workspace_id → workspace`, `user_id → user` (both CASCADE) | [workspace-member.entity.ts](../src/database/entities/workspaces/workspace-member.entity.ts). Unique `(workspaceId, userId)`. Indexed on `userId`. |

---

## Member Roles

### Org roles (`OrgMemberRole`)

Defined in [org-member.entity.ts](../src/database/entities/organizations/org-member.entity.ts). Hierarchy via `OrgMemberRoleWeights` (higher = more privileged). The `OrgMemberGuard` checks the caller's role weight against the minimum weight derived from `@OrgMemberRole(...)` metadata.

| Role | Weight | Capabilities |
|---|---|---|
| `Owner` | 3 | All admin powers; cannot have its role changed or be removed (enforced in `OrganizationService.changeMemberRole` / `removeMember`). Created automatically when an org is created. |
| `Admin` | 2 | Update org metadata, invite members, change member roles (cannot assign a role ≥ own), remove non-owner members, manage webhooks, create/delete workspaces. |
| `Editor` | 1 | Read org info, list members, create resources within workspaces they belong to. |
| `Viewer` | 0 | Read org info, list members. View-only access to org-scoped reads. |

Self-removal is allowed at any role except `Owner` (any member may leave). Cross-removal requires `Admin+` ([organization.service.ts:209](../src/modules/organizations/services/organization.service.ts#L209)).

### Workspace roles (`WorkspaceMemberRole`)

Defined in [workspace-member.entity.ts](../src/database/entities/workspaces/workspace-member.entity.ts). Two flat values, no weight hierarchy.

| Role | Capabilities |
|---|---|
| `Editor` | Read workspace, add other members (alongside org admins). |
| `Viewer` | Read workspace only. |

The creator of a workspace is added as a workspace `Editor` automatically. Adding/removing members and updating/deleting the workspace itself ultimately requires `Admin+` at the org level, except: any workspace `Editor` may add additional members ([workspace.service.ts:104](../src/modules/workspaces/services/workspace.service.ts#L104)).

---

## Subscription Tiers & Plan Limits

Plan type is stored on `organization.plan_type`; quota and seat numbers live on `org_subscription`. New organizations are created at the `Starter` tier with the defaults below ([organization.service.ts:37](../src/modules/organizations/services/organization.service.ts#L37)).

| Plan | Default seats | Default storage | Max scene objects | Max scene lights | HDRI |
|---|---|---|---|---|---|
| `Starter` | 10 | 50 GiB | 3 | 2 | disabled |
| `Growth` | not seeded by default | not seeded by default | 15 | 10 | enabled |
| `Enterprise` | not seeded by default | not seeded by default | unlimited (`Infinity`) | unlimited (`Infinity`) | enabled |

Scene limits come from [`SCENE_LIMITS`](../src/constants/plan-limits.ts). Seats and storage come from `OrgSubscriptionEntity.seatsLimit` / `storageLimitBytes` (both nullable — `null` means unbounded). Only the `Starter` tier has hard-coded seed values in `OrganizationService` (`STARTER_STORAGE_LIMIT_BYTES = 50 GiB`, `STARTER_SEATS_LIMIT = 10`); upgrading to `Growth` / `Enterprise` is currently an out-of-band operation — there is no in-tree code that mutates `planType` or seat/storage limits after creation.

`OrganizationService.inviteMember` enforces `seatsLimit` only when non-null; storage quota enforcement is handled separately by `StorageQuotaService` (see [`StorageQuotaModule`](../src/modules/storage-quota/)).

---

## Per-Org Storage Configuration

Each `org_subscription` row carries a `storage_backend` enum and an opaque `storage_config_encrypted` text column.

| Column | Values |
|---|---|
| `storage_backend` | `local` (default) — files served from the server's filesystem. `s3` — files stored in a per-org S3 bucket using the encrypted `storage_config_encrypted`. |
| `storage_config_encrypted` | AES-256-CBC ciphertext of `JSON.stringify(s3Config)`. Format: `<ivHex>:<ciphertextHex>` (see [encryption.ts](../src/utils/encryption.ts)). Key source: `ConfigService.storageEncryptionKey` (env `STORAGE_ENCRYPTION_KEY`, expected as a hex-encoded 32-byte key). `null` when backend is `local`. |

The S3 config payload (`S3StorageConfigInputDto`, [update-storage-config.request.dto.ts](../src/modules/organizations/dto/update-storage-config.request.dto.ts)) contains:

| Field | Required | Notes |
|---|---|---|
| `region` | yes | AWS region. |
| `bucket` | yes | Bucket name. |
| `accessKeyId` | yes | IAM access key. |
| `secretAccessKey` | yes | IAM secret. |
| `endpoint` | no | Override for S3-compatible providers. |

The plaintext is encrypted in the controller ([organization.controller.ts:201-208](../src/modules/organizations/controllers/organization.controller.ts#L201)) before reaching the service. Decryption happens lazily when `FileStorageService.getStrategyForOrg(orgId)` selects the strategy. See [file-storage.md](file-storage.md) for the strategy interface and the S3 strategy itself.

The endpoint that writes this config requires `Owner` role (`PATCH /organizations/:id/subscription/storage`).

---

## Org Member Guard

[org-member.guard.ts](../src/modules/organizations/guards/org-member.guard.ts) implements `CanActivate`:

1. Reads `:id` from route params and `userId` from `request.session.user.id`.
2. Throws `ForbiddenException` (403) if either is missing.
3. Loads the membership row via `OrgMemberRepository.findByOrgAndUser(orgId, userId)`. Missing → 403.
4. Attaches the membership to `request.orgMember` (typed in [types/index.d.ts](../src/types/index.d.ts)) so handlers can read it without re-querying.
5. If the handler/class is decorated with `@OrgMemberRole(...)`, computes the minimum required role weight (`Math.min(...)`) and rejects if `OrgMemberRoleWeights[member.role] < requiredWeight`.
6. With no `@OrgMemberRole(...)` metadata the guard passes once membership is verified.

The decorator [org-member-role.decorator.ts](../src/modules/organizations/guards/org-member-role.decorator.ts) is the only entry point — it sets the metadata key `orgMemberRole` and applies the guard via `UseGuards(OrgMemberGuard)`. Routes that need org-membership scoping must expose `:id` matching the organization UUID; the guard does not look at any other parameter name.

---

## Org Invite Flow

Invite creation lives in `OrganizationService.inviteMember` ([organization.service.ts:230](../src/modules/organizations/services/organization.service.ts#L230)) and acceptance in `acceptInvite` ([organization.service.ts:271](../src/modules/organizations/services/organization.service.ts#L271)).

```
POST /organizations/:id/invite                     ← Admin+
  └─ verify org exists
  └─ if seatsLimit set: count current members vs seatsLimit (409 if reached)
  └─ if invited email maps to a user already in the org: 409
  └─ create OrgInviteEntity { token = randomUUID(), expiresAt = now + 7d, acceptedAt = null }
  └─ NotificationsService.sendEmail(email, subject, body)
       body = "<frontendUrl>/invite/accept?token=<token>"   ← link is fire-and-forget; failure logged

POST /organizations/invite/accept?token=<uuid>     ← @Public()
  └─ findActiveByToken: token AND acceptedAt IS NULL AND expiresAt > now
  └─ 422 if invite missing/expired
  └─ 422 if no UserEntity matches invitedEmail (caller must register first)
  └─ 409 if already a member
  └─ tx: insert OrgMemberEntity(role = invite.role) + set invite.acceptedAt = now
  └─ best-effort in-app notification to org owner via InAppNotificationsService
```

The accept route is intentionally `@Public()` and registered before `GET /:id` so Express does not match `invite` as the `:id` param ([organization.controller.ts:78-83](../src/modules/organizations/controllers/organization.controller.ts#L78)). Token validity is 7 days (`INVITE_EXPIRES_DAYS`). There is no explicit reject endpoint — invites are simply ignored until they expire.

---

## Workspace Surface

Workspaces are scoping containers under an organization. They drive ownership of scenes (see `ScenesModule` → uses `WorkspacesModule`) and act as the home for workspace-scoped resources.

| Concern | Behaviour |
|---|---|
| Creation | `POST /workspaces` — caller must be org `Admin+`. Creator is added as a `Editor` member in the same transaction. |
| Listing | `GET /workspaces` returns workspaces the caller is a member of. Optional `?orgId=` narrows to a single org. |
| Reading | `GET /workspaces/:id` — caller must be a workspace member; org membership alone is insufficient. |
| Update | `PATCH /workspaces/:id` — `name` only; requires org `Admin+`. |
| Delete | `DELETE /workspaces/:id` — soft-delete; requires org `Admin+`. |
| Add member | `POST /workspaces/:id/members` — caller must be org `Admin+` OR workspace `Editor`; target user must be an existing org member (`422` otherwise); `409` if already a workspace member. |
| Remove member | `DELETE /workspaces/:id/members/:userId` — self-removal allowed at any role; cross-removal requires org `Admin+`. |

All workspace permission logic is enforced in `WorkspaceService` ([workspace.service.ts](../src/modules/workspaces/services/workspace.service.ts)); the `OrgMemberGuard` is not used here because routes are keyed on workspace id, not org id.

---

## Webhooks

Webhooks deliver org-scoped events to an HTTP endpoint registered by an org admin. Per-org subscription is stored in `webhook.events` (string array). Delivery is asynchronous through a Bull queue.

### Events

Defined in [webhooks.constants.ts](../src/modules/organizations/webhooks/webhooks.constants.ts) as the `WEBHOOK_EVENTS` tuple:

| Event | Triggered by |
|---|---|
| `model.uploaded` | `Model3dService.upload3DModel` ([model-3d.service.ts:54](../src/modules/models-3d/services/model-3d.service.ts#L54)) |
| `comment.added` | `ReviewsService` ([reviews.service.ts:90](../src/modules/reviews/services/reviews.service.ts#L90)) and `SceneCommentsService` ([scene-comments.service.ts:85](../src/modules/scenes/comments/scene-comments.service.ts#L85)) |
| `scene.created` | `ScenesService` ([scenes.service.ts:77](../src/modules/scenes/services/scenes.service.ts#L77)) |

### Secret handling

`WebhookCryptoService` ([webhook-crypto.service.ts](../src/modules/organizations/webhooks/services/webhook-crypto.service.ts)):

- `generateSecret()` — 32 random bytes hex-encoded (64-char string).
- `encrypt(raw)` — AES-256-CBC via `encryptAes256` using `STORAGE_ENCRYPTION_KEY` (same key as S3 config encryption).
- `decrypt(cipher)` — symmetric inverse.

The raw secret is shown to the API caller exactly once, in the `POST /organizations/:id/webhooks` response body (`WebhookCreateResponseDto.secret`). Only the encrypted form is persisted in `webhook.secret`.

### Delivery pipeline

```
service code
  └─ WebhookDeliveryService.dispatch(orgId, event, payload)        ← non-blocking, errors swallowed
       └─ WebhookRepository.findActiveForEvent(orgId, event)
            (isActive = true AND deletedAt IS NULL AND :event = ANY(events))
       └─ for each → webhookQueue.add(WEBHOOK_DELIVER_JOB, { webhookId, event, payload },
                       { attempts: 3, backoff: exponential 5s, removeOnComplete, removeOnFail })

WebhookProcessor.deliver(job)                                       ← Bull worker
  ├─ load webhook; skip if missing or inactive
  ├─ rawSecret = cryptoService.decrypt(webhook.secret)
  ├─ body = JSON.stringify({ event, payload, deliveredAt: <iso> })
  ├─ signature = HMAC-SHA256(rawSecret, body) → hex
  ├─ POST webhook.url with:
  │     Content-Type: application/json
  │     X-Webhook-Signature: sha256=<hex>
  │     X-Webhook-Event: <event>
  │     body: <body>                                  (10 s AbortController timeout)
  ├─ persist WebhookDeliveryLogEntity { webhookId, event, payload,
  │     responseStatus, deliveredAt or failedAt }
  └─ on non-2xx or fetch error: throw → Bull retries per attempts/backoff
```

Triggering a webhook from a service is a single non-blocking call:

```typescript
await this.webhookDeliveryService.dispatch(orgId, 'model.uploaded', {
  modelId,
  workspaceId,
});
```

`dispatch` catches and logs all enqueue failures; it never propagates errors to the caller. This is intentional — webhook delivery must not affect the success of the originating mutation.

### Endpoints

All webhook endpoints require org `Admin+` and live under `/organizations/:id/webhooks` ([webhooks.controller.ts](../src/modules/organizations/webhooks/controllers/webhooks.controller.ts)).

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/organizations/:id/webhooks` | Register a webhook. Returns `WebhookCreateResponseDto` (response includes the **plaintext** secret — only chance to capture it). |
| `GET` | `/organizations/:id/webhooks` | List the org's webhooks (no secrets in payload). |
| `DELETE` | `/organizations/:id/webhooks/:webhookId` | Soft-delete the webhook. |
| `GET` | `/organizations/:id/webhooks/:webhookId/deliveries` | Last 20 delivery log rows for the webhook. |

There is no PATCH endpoint — to change events or rotate the URL/secret, delete and re-create.

---

## Endpoints

### `OrganizationController` — `/organizations` ([organization.controller.ts](../src/modules/organizations/controllers/organization.controller.ts))

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/organizations` | `@Roles(User)` | Create a new org; caller becomes `Owner`. Auto-creates `Starter` subscription (50 GiB, 10 seats, local storage). |
| `GET` | `/organizations/current` | `@Roles(User)` | Orgs the caller is a member of, with subscription summary. |
| `POST` | `/organizations/invite/accept?token=` | `@Public()` | Accept an invite by token. Email must already match a registered user. |
| `GET` | `/organizations/:id` | `@Roles(User)` | Org detail — must be a member, otherwise `403`. |
| `PATCH` | `/organizations/:id` | `@OrgMemberRole(Admin)` | Update org `name`. |
| `GET` | `/organizations/:id/members` | `@OrgMemberRole(Viewer)` | Paginated member list. |
| `POST` | `/organizations/:id/invite` | `@OrgMemberRole(Admin)` | Send invite email. `409` on seat limit or duplicate. |
| `PATCH` | `/organizations/:id/members/:userId` | `@OrgMemberRole(Admin)` | Change a member's role. Cannot demote the owner, cannot edit self, cannot assign ≥ own role. |
| `DELETE` | `/organizations/:id/members/:userId` | `@Roles(User)` | Remove member. Self-removal allowed; cross-removal requires `Admin+`. Cannot remove `Owner`. |
| `GET` | `/organizations/:id/subscription` | `@OrgMemberRole(Viewer)` | Plan + storage limit + seats + bytes used (joins `StorageQuotaService`). |
| `PATCH` | `/organizations/:id/subscription/storage` | `@OrgMemberRole(Owner)` | Switch storage backend; encrypts `s3Config` before persisting. |

### `WorkspaceController` — `/workspaces` ([workspace.controller.ts](../src/modules/workspaces/controllers/workspace.controller.ts))

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/workspaces` | `@Roles(User)` (org `Admin+` enforced in service) | Create workspace; creator added as `Editor`. |
| `GET` | `/workspaces?orgId=` | `@Roles(User)` | Workspaces the caller belongs to (optionally filtered by org). |
| `GET` | `/workspaces/:id` | `@Roles(User)` (workspace member) | Workspace detail. |
| `PATCH` | `/workspaces/:id` | `@Roles(User)` (org `Admin+`) | Rename workspace. |
| `DELETE` | `/workspaces/:id` | `@Roles(User)` (org `Admin+`) | Soft-delete workspace. |
| `POST` | `/workspaces/:id/members` | `@Roles(User)` (org `Admin+` OR ws `Editor`) | Add an existing org member to the workspace. |
| `DELETE` | `/workspaces/:id/members/:userId` | `@Roles(User)` (self or org `Admin+`) | Remove workspace member. |

### `WebhooksController` — `/organizations/:id/webhooks` ([webhooks.controller.ts](../src/modules/organizations/webhooks/controllers/webhooks.controller.ts))

See [Webhooks → Endpoints](#endpoints-2) above.

---

## DTOs of Note

| DTO | File | Notable fields |
|---|---|---|
| `OrganizationCreateRequestDto` | [organization.create.request.dto.ts](../src/modules/organizations/dto/organization.create.request.dto.ts) | `name` (≤100), `slug` matched against `/^[a-z0-9-]+$/`, ≤50. |
| `OrganizationResponseDto` | [organization.response.dto.ts](../src/modules/organizations/dto/organization.response.dto.ts) | `id`, `name`, `slug`, `planType`, `createdAt`, optional `subscription` (`OrgSubscriptionSummaryDto`: `storageLimitBytes`, `seatsLimit`, `storageBackend`). |
| `OrgSubscriptionDetailDto` | [org-subscription.detail.dto.ts](../src/modules/organizations/dto/org-subscription.detail.dto.ts) | Like `Summary` plus `storageUsedBytes` (computed by `StorageQuotaService.getStorageUsed`). |
| `OrgInviteCreateRequestDto` | [org-invite.create.request.dto.ts](../src/modules/organizations/dto/org-invite.create.request.dto.ts) | `email` (validated), `role` (`OrgMemberRole`). |
| `UpdateStorageConfigRequestDto` | [update-storage-config.request.dto.ts](../src/modules/organizations/dto/update-storage-config.request.dto.ts) | `storageBackend` enum, optional nested `s3Config` (`S3StorageConfigInputDto`). |
| `WorkspaceCreateRequestDto` | [workspace.create.request.dto.ts](../src/modules/workspaces/dto/workspace.create.request.dto.ts) | `name` (≤100), `orgId` (UUID). |
| `WorkspaceMemberAddRequestDto` | [workspace-member.add.request.dto.ts](../src/modules/workspaces/dto/workspace-member.add.request.dto.ts) | `userId` (UUID), `role` (`WorkspaceMemberRole`). |
| `WebhookCreateRequestDto` | [webhook.create.request.dto.ts](../src/modules/organizations/webhooks/dto/webhook.create.request.dto.ts) | `url` (`@IsUrl({ require_tld: false })`), `events` (non-empty array, each `IsIn(WEBHOOK_EVENTS)`). |
| `WebhookCreateResponseDto` | [webhook.create.response.dto.ts](../src/modules/organizations/webhooks/dto/webhook.create.response.dto.ts) | Extends `WebhookResponseDto` with `secret` — the only response that exposes the plaintext signing secret. |

---

## Cross-references

- [auth.md](auth.md) — global `JwtAuthGuard`, session lookup, `@Public()` / `@Roles()` decorators that protect every endpoint listed here.
- [file-storage.md](file-storage.md) — strategy interface and S3 strategy that consumes `org_subscription.storage_config_encrypted`.
- [database.md](database.md) — full schema diagrams, including the `organizations` and `workspaces` schemas summarised above.
- [modules.md](modules.md) — high-level module catalogue including `OrganizationsModule`, `WorkspacesModule`, and `WebhooksModule` dependency wiring.
- [api.md](api.md) — auto-generated endpoint reference; this file documents the access rules and lifecycle, not request/response shapes.
