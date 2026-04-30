# Organization & Workspace Dashboard

The MeshHub client surfaces organization administration and workspace management through three pages: the org-creation form, the org dashboard (tabbed view for members, workspaces, embeds, webhooks, API keys, storage), and a per-workspace dashboard that links into scenes. This document covers the page-level wiring, RTK Query consumption, role-based gating, and cross-references to related docs.

---

## Scope

A single landing page (`OrgDashboardPage`) lets organization admins manage everything that lives at the **org** level — members, workspaces, embed projects, API keys, webhooks, subscription/plan info, storage backend. A separate `WorkspaceDashboardPage` is the entry point for a specific workspace and links forward to the workspace's `ScenesPage`. Organization creation is a standalone form at `/org/create`.

The dashboard itself does not provide org-level CRUD (rename/delete) — only member/workspace/integration management. Org rename/delete are not currently exposed in the UI.

---

## Routes

All organization-scoped routes are nested under `RouterPaths.Org` (`/org`) declared in [src/app/router/index.tsx](../src/app/router/index.tsx) and constants in [src/shared/router/paths.ts](../src/shared/router/paths.ts).

| Path | Component | Source |
|---|---|---|
| `/org/create` | `OrgCreatePage` | [src/pages/OrgCreate/OrgCreate.tsx](../src/pages/OrgCreate/OrgCreate.tsx) |
| `/org/:orgId` | `OrgDashboardPage` | [src/pages/OrgDashboard/OrgDashboard.tsx](../src/pages/OrgDashboard/OrgDashboard.tsx) |
| `/org/:orgId/workspace/:workspaceId` | `WorkspaceDashboardPage` | [src/pages/OrgDashboard/WorkspaceDashboard.tsx](../src/pages/OrgDashboard/WorkspaceDashboard.tsx) |
| `/org/:orgId/workspace/:workspaceId/scenes` | `ScenesPage` | [src/pages/Scenes/ScenesPage.tsx](../src/pages/Scenes/ScenesPage.tsx) |
| `/org/:orgId/workspace/:workspaceId/scenes/:sceneId` | `SceneEditorPage` | (out of scope here) |
| `/org/:orgId/embed/:projectId` | `EmbedProjectPage` | (out of scope here) |

Path segments are composed from the `Org`, `OrgId`, `OrgCreate`, `WorkspaceSeg`, `WorkspaceId`, and `Scenes` keys. Use [`buildAbsolutePath`](../src/shared/utils/router.ts) when generating links from the dashboard.

---

## OrgDashboard tab set

`OrgDashboardPage` is a single Mantine `Tabs` component. **Tab panels are inlined** in [OrgDashboard.tsx](../src/pages/OrgDashboard/OrgDashboard.tsx) except for `WebhooksTab` and `ApiKeysTab`, which are extracted into [components/](../src/pages/OrgDashboard/components/). There is no per-tab folder.

| Tab value | Label (ru) | Inline / extracted | API modules consumed | Visibility |
|---|---|---|---|---|
| `members` | Участники | inline | [organizations.ts](../src/app/api/organizations.ts) | always |
| `workspaces` | Рабочие пространства | inline | [workspaces.ts](../src/app/api/workspaces.ts) | always |
| `embed` | Embed | inline | [embed.ts](../src/app/api/embed.ts), [models-3d.ts](../src/app/api/models-3d.ts), [scenes.ts](../src/app/api/scenes.ts) | always |
| `webhooks` | Webhooks | [WebhooksTab.tsx](../src/pages/OrgDashboard/components/WebhooksTab.tsx) | [webhooks.ts](../src/app/api/webhooks.ts) | Admin/Owner only |
| `apiKeys` | API-ключи | [ApiKeysTab.tsx](../src/pages/OrgDashboard/components/ApiKeysTab.tsx) | [api-keys.ts](../src/app/api/api-keys.ts) | Admin/Owner only |
| `storage` | Хранилище | inline | [organizations.ts](../src/app/api/organizations.ts) | Owner only |

A separate `MembersTab`, `WorkspacesTab`, `SubscriptionTab`, or `StorageTab` component does **not** exist. Subscription metadata is rendered in the page header (`Badge` for `planType`, `QuotaBar` for storage) and not as its own tab. The storage **configuration** tab is the only place storage settings can be edited from the UI.

---

## Member management

Member operations are bound directly to org RTK Query hooks. The `OrgMemberRole` enum from [dto.ts:145](../src/app/api/dto.ts#L145):

```ts
export const OrgMemberRole = {
  Owner:  'owner',
  Admin:  'admin',
  Editor: 'editor',
  Viewer: 'viewer',
} as const;
```

Note: the spec name `MEMBER` does not exist in this codebase — the equivalent role is `Editor`. The Russian-label map is defined inline in [OrgDashboard.tsx:48](../src/pages/OrgDashboard/OrgDashboard.tsx#L48).

| Action | Hook | Endpoint shape |
|---|---|---|
| List members | `useOrgMembersQuery` | `GET /organizations/:id/members` |
| Invite by email | `useInviteOrgMemberMutation` | `POST /organizations/:id/invite`, body `{ email, role }` |
| Change role | `useChangeOrgMemberRoleMutation` | `PATCH /organizations/:id/members/:userId`, body `{ role }` |
| Remove (revoke) | `useRemoveOrgMemberMutation` | `DELETE /organizations/:id/members/:userId` |
| Accept invite | `useAcceptOrgInviteMutation` | `POST /organizations/invite/accept`, body `{ token }` |

Invite UI restricts the role select to the `INVITABLE_ROLES` constant — `Owner` cannot be assigned via invite. Each row's action `Menu` is rendered only when `m.role !== OrgMemberRole.Owner`, so the existing owner is non-editable from the table.

Cache invalidation: invite/role change/remove each invalidate `{ type: ApiTags.OrgMembers, id: orgId }`.

---

## Workspaces

Workspace cards are rendered as `Link`s to the workspace dashboard. Members of a workspace are a **subset** of org members (the server enforces this; the client just allows attaching existing org members).

| Action | Hook | Endpoint |
|---|---|---|
| List by org | `useMyWorkspacesQuery({ orgId })` | `GET /workspaces?orgId=...` |
| Get single | `useWorkspaceQuery(id)` | `GET /workspaces/:id` |
| Create | `useCreateWorkspaceMutation` | `POST /workspaces`, body `{ name, orgId }` |
| Rename | `useUpdateWorkspaceMutation` | `PATCH /workspaces/:id`, body `{ name? }` |
| Delete | `useDeleteWorkspaceMutation` | `DELETE /workspaces/:id` |
| Add member | `useAddWorkspaceMemberMutation` | `POST /workspaces/:id/members`, body `{ userId, role }` |
| Remove member | `useRemoveWorkspaceMemberMutation` | `DELETE /workspaces/:id/members/:userId` |

Workspace member roles use a narrower enum, [`WorkspaceMemberRole`](../src/app/api/dto.ts#L153) — only `Editor` and `Viewer`.

The `WorkspacesTab` body in [OrgDashboard.tsx](../src/pages/OrgDashboard/OrgDashboard.tsx) currently only exposes **Create** and **navigate**. Rename, delete, and member CRUD hooks exist in [workspaces.ts](../src/app/api/workspaces.ts) but are not yet wired into a UI surface.

### Workspace dashboard

[WorkspaceDashboard.tsx](../src/pages/OrgDashboard/WorkspaceDashboard.tsx) shows the workspace name, a horizontal scroll of "recently opened" models/scenes pulled from `localStorage` via [`getRecent`](../src/shared/utils/recentlyOpened.ts), and a single **Scenes** button that navigates to `/org/:orgId/workspace/:workspaceId/scenes`. It does **not** display the workspace member list — that surface does not exist yet.

---

## Subscription / plan info

There is no dedicated Subscription tab. Plan information is shown in two places on `OrgDashboardPage`:

1. **Header badge** — `org.planType` from `OrganizationResponseDto.planType` ([`PlanType`](../src/app/api/dto.ts#L159) is `starter` | `growth` | `enterprise`).
2. **Storage QuotaBar** — uses `subscription.storageLimitBytes` from `OrgSubscriptionSummaryDto` and `subscriptionDetail.storageUsedBytes` from `useGetOrgSubscriptionQuery`.

Display is **read-only** — there is no self-service plan-change UI. `seatsLimit` is exposed in the DTO but not rendered. To change a plan the org owner currently needs server-side intervention.

---

## Storage tab

Visible only when `isOwner` is true (Owner has the only role allowed to touch credentials). The tab UI is inline in [OrgDashboard.tsx](../src/pages/OrgDashboard/OrgDashboard.tsx#L396) and consumes `useUpdateOrgStorageConfigMutation`.

| Field | DTO source |
|---|---|
| `storageBackend` | [`StorageBackend`](../src/app/api/dto.ts#L166) — `local` (default) \| `s3` |
| `s3Config.region`, `bucket`, `accessKeyId`, `secretAccessKey`, `endpoint?` | [`S3StorageConfigDto`](../src/app/api/dto.ts#L186) |

The Secret Access Key input uses `type="password"` for masked entry but is **sent in clear** to the server, where it is encrypted at rest. The form does not pre-populate from existing config — submitting it always replaces the stored credentials. The QuotaBar in the header uses `storageUsedBytes` from `OrgSubscriptionDetailDto`; backend type (`local` vs `s3`) is on `OrgSubscriptionSummaryDto.storageBackend` but is not displayed back to the user.

For the encryption / `IFileStorageStrategy` selection logic on the server, see [../../server/docs/organizations.md](../../server/docs/organizations.md) and [../../server/docs/file-storage.md](../../server/docs/file-storage.md).

---

## API Keys tab

Source: [components/ApiKeysTab.tsx](../src/pages/OrgDashboard/components/ApiKeysTab.tsx). Visible to Admin/Owner.

Hooks from [api-keys.ts](../src/app/api/api-keys.ts):

| Action | Hook | Endpoint |
|---|---|---|
| List | `useGetApiKeysQuery(orgId)` | `GET /api-keys?orgId=...` |
| Create | `useCreateApiKeyMutation` | `POST /api-keys`, body `ApiKeyCreateRequestDto` |
| Revoke | `useRevokeApiKeyMutation` | `DELETE /api-keys/:keyId?orgId=...` |

Scopes from [`API_KEY_SCOPES`](../src/app/api/dto.ts#L842):

```ts
export const API_KEY_SCOPES = ['embed:read', 'read:models', 'read:scenes'] as const;
```

A `SCOPE_LABELS` map in [ApiKeysTab.tsx:31](../src/pages/OrgDashboard/components/ApiKeysTab.tsx#L31) provides the Russian label per scope.

### Raw key reveal flow

`ApiKeyResponseDto.rawKey` is **populated only on the create response** — never on subsequent `GET /api-keys` responses. The flow:

1. Submit the create form → `setCreatedKey(res)` swaps the modal body into a "secret reveal" view.
2. The modal is rendered with `closeOnClickOutside={false}` and `closeOnEscape={false}` while a secret is shown, to prevent accidental loss.
3. A `CopyButton` exposes copy-to-clipboard (toggling between `IconCopy` and `IconCheck` for 2 s).
4. The user must press "Я сохранил ключ" to acknowledge — only then does the modal close and reset.

The list view shows only `prefix`, `scopes`, `lastUsedAt`, `expiresAt`, and a revoked/active status badge. Revoke uses Mantine's `modals.openConfirmModal` for a destructive confirmation. The raw key is never recoverable after the create modal closes.

---

## Webhooks tab

Source: [components/WebhooksTab.tsx](../src/pages/OrgDashboard/components/WebhooksTab.tsx). Visible to Admin/Owner.

Hooks from [webhooks.ts](../src/app/api/webhooks.ts):

| Action | Hook | Endpoint |
|---|---|---|
| List | `useGetWebhooksQuery(orgId)` | `GET /organizations/:orgId/webhooks` |
| Create | `useCreateWebhookMutation` | `POST /organizations/:orgId/webhooks`, body `{ url, events }` |
| Revoke | `useRevokeWebhookMutation` | `DELETE /organizations/:orgId/webhooks/:webhookId` |
| Deliveries | `useGetWebhookDeliveriesQuery` | `GET /organizations/:orgId/webhooks/:webhookId/deliveries` |

Events from [`WEBHOOK_EVENTS`](../src/app/api/dto.ts#L808):

```ts
export const WEBHOOK_EVENTS = ['model.uploaded', 'comment.added', 'scene.created'] as const;
```

### Create flow & secret display

The form validates the URL client-side: must parse as `URL` and protocol must be `http:` or `https:`. At least one event must be selected.

`WebhookCreateResponseDto` extends the regular response with a `secret` field. Same one-shot reveal pattern as API keys — the secret is shown once in a non-dismissable modal with a `CopyButton`, accompanied by a notice that the secret signs deliveries via HMAC SHA-256.

### Deliveries log

Opening the history icon on a row mounts the `DeliveriesModal` (last N deliveries, where N is server-determined). Each row shows:

- `event` badge (from [`WebhookDeliveryLogDto.event`](../src/app/api/dto.ts#L829))
- status badge: green when `deliveredAt && responseStatus < 400`, otherwise red with the numeric `responseStatus` or "Ошибка"
- timestamp: `deliveredAt ?? failedAt ?? createdAt`

The UI does not currently show `payload`, allow manual re-delivery, or surface retry counts. Retry behaviour is server-driven (see [../../server/docs/notifications.md](../../server/docs/notifications.md) for queue / retry policy if applicable).

---

## Role-based UI gating

There is **no shared role-check helper** — every gate is computed inline in [OrgDashboard.tsx](../src/pages/OrgDashboard/OrgDashboard.tsx#L107) by scanning `membersPage.data` for the current user:

```ts
const isOwner = members.some(m => m.userId === currentUser?.id && m.role === OrgMemberRole.Owner);
const isAdmin = members.some(m => m.userId === currentUser?.id &&
  (m.role === OrgMemberRole.Owner || m.role === OrgMemberRole.Admin));
```

Resulting visibility table:

| Surface | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|
| Members tab (read) | yes | yes | yes | yes |
| Members tab — invite/remove/role change | yes | yes | (not gated, but server rejects) | (server rejects) |
| Workspaces tab (read) | yes | yes | yes | yes |
| Workspaces tab — create | yes | yes | (server-enforced) | (server-enforced) |
| Embed tab | yes | yes | yes | yes |
| Webhooks tab (visible & writable) | yes | yes | hidden | hidden |
| API-ключи tab | yes | yes | hidden | hidden |
| Хранилище tab | yes | hidden | hidden | hidden |
| Org rename/delete | not exposed in UI | — | — | — |

The Members and Workspaces tab action buttons are **not** disabled for Editor/Viewer — they are visible and the server is the final authority. Only the Webhooks/API-keys/Storage tabs are conditionally rendered. A future cleanup would be to extract a `useOrgRole(orgId)` hook so action buttons can be disabled/hidden uniformly.

`WorkspaceDashboardPage` does no role gating today — anyone able to load the workspace can navigate to scenes.

---

## OrgSwitcher widget

Source: [src/widgets/OrgSwitcher/OrgSwitcher.tsx](../src/widgets/OrgSwitcher/OrgSwitcher.tsx). Rendered in the top bar (consumed by `Header`).

Behaviour:

- Trigger: Mantine `Button` showing the current org name, or "Организация" placeholder.
- Dropdown lists every org from `useMyOrganizationsQuery()` except the current one (the current is rendered as a `Menu.Label`).
- "Создать организацию" entry navigates to `/org/create`.
- Below a divider, dropdown lists workspaces of the current org from `useMyWorkspacesQuery({ orgId })`. Selecting one calls `orgActions.setCurrentWorkspace(id)` — it does **not** navigate.
- Selecting an org calls `orgActions.setCurrentOrg(id)` and navigates to that org's dashboard. `setCurrentOrg` resets `currentWorkspaceId` to `null` (see [entities/organization/model.ts:31](../src/entities/organization/model.ts#L31)).

### Persistence

Last selection is persisted to `localStorage` under key `@mesh_hub/org` via `redux-persist`. The persistence wrapper is configured in [src/entities/organization/model.ts](../src/entities/organization/model.ts) using a custom `WebStorage` shim around `window.localStorage`. State shape:

```ts
interface OrgState {
  currentOrgId: string | null;
  currentWorkspaceId: string | null;
}
```

Selectors `currentOrgIdSelector` and `currentWorkspaceIdSelector` are exported from [entities/organization/index.ts](../src/entities/organization/index.ts) and re-exported via the layer's barrel. The slice key is `state.org`.

`OrgCreatePage` also dispatches `orgActions.setCurrentOrg(id)` immediately after a successful create, so the new org becomes the active one.

---

## Cross-references

- [routing.md](./routing.md) — full route tree and `RouterPaths` constants.
- [api.md](./api.md) — RTK Query base, tag taxonomy, refresh-mutex pattern.
- [widgets.md](./widgets.md) — `OrgSwitcher`, `QuotaBar`, `Header` widgets in the broader catalogue.
- [state-management.md](./state-management.md) — Redux slices, redux-persist setup.
- [../../server/docs/organizations.md](../../server/docs/organizations.md) — server-side org/membership/subscription model, S3 credential encryption.
- [../../server/docs/file-storage.md](../../server/docs/file-storage.md) — `IFileStorageStrategy` selection per org.
- [../../server/docs/notifications.md](../../server/docs/notifications.md) — webhook delivery / retry pipeline.
