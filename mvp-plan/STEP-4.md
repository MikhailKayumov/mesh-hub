# STEP-4 — Frontend: Organizations & Workspaces

**Block:** 1 — Orgs & Workspaces
**Prerequisites:** STEP-2, STEP-3 (backend must be running)
**Parallel with:** STEP-5/6 (ZIP frontend) after this is done

---

## Goal

Add org/workspace state management, API layer, and the minimum UI needed for org creation,
switching, and dashboard.

---

## 1. RTK Query Tags

**File:** `client/src/app/api/tags.ts`

Add:
```ts
Organization: 'Organization',
OrgMembers: 'OrgMembers',
Workspaces: 'Workspaces',
Workspace: 'Workspace',
```

---

## 2. API Modules

### `client/src/app/api/organizations.ts`

Endpoints (all use `Api.injectEndpoints({ overrideExisting: true })`):

- `createOrganization` — POST `/organizations`; invalidates `Organization`.
- `myOrganizations` — GET `/organizations/current`; provides `Organization`.
- `organization` — GET `/organizations/:id`; provides `{ type: Organization, id }`.
- `updateOrganization` — PATCH `/organizations/:id`; invalidates `{ type: Organization, id }`.
- `orgMembers` — GET `/organizations/:id/members`; provides `OrgMembers`.
- `inviteOrgMember` — POST `/organizations/:id/invite`; invalidates `OrgMembers`.
- `changeOrgMemberRole` — PATCH `/organizations/:id/members/:userId`; invalidates `OrgMembers`.
- `removeOrgMember` — DELETE `/organizations/:id/members/:userId`; invalidates `OrgMembers`.
- `orgSubscription` — GET `/organizations/:id/subscription`; provides `Organization`.

Export all generated hooks.

### `client/src/app/api/workspaces.ts`

Endpoints:

- `createWorkspace` — POST `/workspaces`; invalidates `Workspaces`.
- `myWorkspaces` — GET `/workspaces`; provides `Workspaces`.
- `workspace` — GET `/workspaces/:id`; provides `{ type: Workspace, id }`.
- `updateWorkspace` — PATCH `/workspaces/:id`; invalidates `Workspaces`.
- `deleteWorkspace` — DELETE `/workspaces/:id`; invalidates `Workspaces`.
- `addWorkspaceMember` — POST `/workspaces/:id/members`; invalidates `Workspace`.
- `removeWorkspaceMember` — DELETE `/workspaces/:id/members/:userId`; invalidates `Workspace`.

Export all generated hooks.

---

## 3. Redux Slice: Organization

**Directory:** `client/src/entities/organization/`

**`client/src/entities/organization/model.ts`** (Redux slice):

```ts
// State shape:
{
  currentOrgId: string | null,
  currentWorkspaceId: string | null,
}
// Persisted to localStorage under key '@mesh_hub/org'
```

Actions: `setCurrentOrg(orgId)`, `setCurrentWorkspace(workspaceId)`, `clearOrg()`.

**`client/src/entities/organization/index.ts`** — re-export slice, actions, selectors.

**`client/src/app/store/`** — Add org slice to the Redux store with `redux-persist`
configuration. Key: `'@mesh_hub/org'`. Add to the root reducer.

---

## 4. URLs

**File:** `client/src/app/api/urls.ts`

Add:
```ts
Organizations: 'organizations',
Workspaces: 'workspaces',
```

**File:** `client/src/shared/constants/` (or router constants)

Add routes:
```ts
RouterPaths.OrgCreate = '/org/create'
RouterPaths.OrgDashboard = '/org/:orgId'
RouterPaths.WorkspaceDashboard = '/org/:orgId/workspace/:workspaceId'
```

---

## 5. Pages

### `client/src/pages/OrgCreate/`

Files: `index.tsx`, `OrgCreate.tsx`.

**`OrgCreate.tsx`** — Mantine `TextInput` for name, `TextInput` for slug (auto-generated
from name via slugify, user-editable). Submit calls `useCreateOrganizationMutation()`.
On success: dispatch `setCurrentOrg(result.id)`, navigate to `/org/:id`.

### `client/src/pages/OrgDashboard/`

Files: `index.tsx`, `OrgDashboard.tsx`, `OrgDashboard.module.scss`.

Sections:
1. **Header** — org name, plan badge, `QuotaBar` widget for storage.
2. **Members tab** — table of members (name, email, role, actions). Invite button opens
   inline form (email + role select). Role change + remove via kebab menu.
3. **Workspaces tab** — list of workspaces. Create workspace button. Each workspace card
   links to `/org/:orgId/workspace/:workspaceId`.

Uses: `useOrganizationQuery`, `useOrgMembersQuery`, `useMyWorkspacesQuery`.

---

## 6. Widgets

### `client/src/widgets/OrgSwitcher/`

Files: `index.tsx`, `OrgSwitcher.tsx`.

A Mantine `Menu` dropdown showing:
- Current org name (header item, non-clickable).
- List of user's other orgs — click to `setCurrentOrg` + navigate to org dashboard.
- "Create organization" item → navigate to `/org/create`.
- Divider.
- Current workspace (sub-header).
- List of workspaces in current org — click to `setCurrentWorkspace`.

Reads `currentOrgId` + `currentWorkspaceId` from Redux.
Fetches orgs via `useMyOrganizationsQuery()`, workspaces via `useMyWorkspacesQuery({ orgId })`.

**Integration:** Add `<OrgSwitcher />` to the existing `widgets/Header/` component, next to
the user avatar/menu. Place it only when the user is authenticated.

### `client/src/widgets/QuotaBar/`

Files: `index.tsx`, `QuotaBar.tsx`, `QuotaBar.module.scss`.

Props:
```ts
interface QuotaBarProps {
  used: number;
  limit: number | null;  // null = unlimited
  unit?: 'bytes' | 'count';
  label?: string;
}
```

Rendering:
- If `limit === null`: render "Unlimited" text, no bar.
- Otherwise: render Mantine `Progress` with color based on fill ratio:
  - 0–60%: `color="green"`
  - 60–80%: `color="yellow"`
  - 80–100%: `color="red"`
- Below the bar: `{formatted(used)} / {formatted(limit)} {unit label}`.

Use `Intl.NumberFormat` for bytes formatting (GB/MB/KB).

---

## 7. Router Updates

**File:** `client/src/app/router/` (wherever routes are defined)

Add lazy routes:
```ts
{ path: '/org/create', element: lazy(() => import('@/pages/OrgCreate')) }
{ path: '/org/:orgId', element: lazy(() => import('@/pages/OrgDashboard')) }
```

Protect these routes under the existing authenticated route guard.

---

## Verification

1. Create an org → redirected to dashboard; org appears in `OrgSwitcher` dropdown.
2. Invite a member by email → invite email sent (check network tab); accept via URL → member visible in table.
3. `QuotaBar` at 85% fill → red color.
4. Switching org in `OrgSwitcher` → `currentOrgId` in Redux state changes; dashboard content updates.
5. `npm run tscheck` in `client/` passes.
