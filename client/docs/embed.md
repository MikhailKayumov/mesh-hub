# Embed

The Embed feature has **two distinct surfaces** that share the same backend module but live in different parts of the route tree and have different trust models:

| Surface | Audience | Auth | Page component |
|---|---|---|---|
| Settings page | Org admin / member, signed in | Cookie session + org membership | `EmbedProjectPage` (`src/pages/EmbedProject/`) |
| Public viewer | Anonymous browser inside an `<iframe>` on a customer site | `X-Api-Key` header + Origin/Referer match | `EmbedViewerPage` (`src/pages/EmbedViewer/`) |

The settings page configures an `EmbedProject` (which model or scene to expose, allowed origins, branding). The public viewer is what end-users see embedded on third-party websites.

---

## Routes

Defined in [`src/app/router/index.tsx`](../src/app/router/index.tsx) and the path constants in [`src/shared/router/paths.ts`](../src/shared/router/paths.ts).

| Path | Component | Layout shell | Auth |
|---|---|---|---|
| `/org/:orgId/embed/:projectId` | `EmbedProjectPage` (lazy) | `BasePage` → `BaseLayout` | Cookie session, member of `:orgId` |
| `/embed/:modelId` | `EmbedViewerPage` (lazy) | **None** — top-level route, no `BasePage` | `?apiKey=…` query param, server validates against the project's allowed origins |

The settings route is a child of the `Org` segment and inherits the standard authenticated shell (Header, OrgSwitcher, NotificationBell, sidebar — see below). The public viewer is a separate top-level entry sibling to `Editor`, intentionally outside `BasePage`.

---

## EmbedProject page layout

**File:** [`src/pages/EmbedProject/EmbedProjectPage.tsx`](../src/pages/EmbedProject/EmbedProjectPage.tsx)

The page reads `:orgId` and `:projectId` from the URL, fetches the org's project list via `useEmbedProjectsQuery(orgId)`, and finds the matching project. It renders three Mantine `Tabs` (`Tabs.List` + `Tabs.Panel`):

| Tab | `Tabs.Panel value` | Controls | Underlying mutation |
|---|---|---|---|
| Домены | `domains` | `TextInput` for new origin, `Button` "Добавить", list of `project.allowedOrigins` with per-row "Удалить" | `addEmbedDomain`, `removeEmbedDomain` |
| Брендинг | `branding` | `Switch` "Powered by MeshHub" badge, `TextInput` for primary color (hex), `FileInput` for logo, `Button` "Сохранить" | `uploadEmbedLogo` (if file present), then `updateEmbedProject` with `brandingConfig` |
| Аналитика | `analytics` | `BarChart` (`@mantine/charts`) of daily views, "Топ источников" list | `useEmbedAnalyticsQuery` |

**Project type — model vs scene.** An `EmbedProjectResponseDto` carries both `modelId` and `sceneId` as nullable string fields; exactly one is populated and the type is determined server-side, surfaced in the viewer response as `EmbedViewerResponseDto.type: 'model' | 'scene'`. The settings page itself does not currently expose UI to change the source between model and scene — that choice is made at create time via `EmbedProjectCreateRequestDto`.

**`autoRotate`** is on the response/update DTOs but is not edited from `EmbedProjectPage` today; only the public viewer reads it.

**Branding state is local.** `showBadge`, `primaryColor`, and `logoFile` are seeded from the project on first render and only flushed on "Сохранить" — there is no auto-save.

---

## RTK Query — Embed endpoints

**File:** [`src/app/api/embed.ts`](../src/app/api/embed.ts)
**Server module:** `embed`
**URL prefix:** `ApiUrls.Embed = 'embed'`

| Hook | Method | URL | Args | Response |
|---|---|---|---|---|
| `useEmbedViewerQuery` | `GET` | `embed/:modelId` (with `X-Api-Key` header) | `{ modelId, apiKey }` | `EmbedViewerResponseDto` |
| `useEmbedProjectsQuery` | `GET` | `embed/projects?orgId=…` | `orgId` | `EmbedProjectResponseDto[]` |
| `useCreateEmbedProjectMutation` | `POST` | `embed/projects` | `EmbedProjectCreateRequestDto` | `EmbedProjectResponseDto` |
| `useUpdateEmbedProjectMutation` | `PATCH` | `embed/projects/:id` | `{ id, body: EmbedProjectUpdateRequestDto }` | `EmbedProjectResponseDto` |
| `useAddEmbedDomainMutation` | `POST` | `embed/projects/:id/domains` | `{ id, domain }` | `EmbedProjectResponseDto` |
| `useRemoveEmbedDomainMutation` | `DELETE` | `embed/projects/:id/domains/:domain` (URL-encoded) | `{ id, domain }` | `void` |
| `useEmbedAnalyticsQuery` | `GET` | `embed/projects/:id/analytics` | `id` | `ViewAnalyticsResponseDto` |
| `useUploadEmbedLogoMutation` | `POST` | `embed/projects/:id/logo` (multipart) | `{ id, file }` | `EmbedProjectResponseDto` |

### Cache tags

| Endpoint | Provides | Invalidates |
|---|---|---|
| `embedViewer` | — | — |
| `embedProjects` | `{ type: EmbedProjects, id: orgId }` | — |
| `createEmbedProject` | — | `{ type: EmbedProjects, id: arg.orgId }` |
| `updateEmbedProject` | — | `{ type: EmbedProject, id: arg.id }` |
| `addEmbedDomain` | — | `{ type: EmbedProject, id: arg.id }` |
| `removeEmbedDomain` | — | `{ type: EmbedProject, id: arg.id }` |
| `embedAnalytics` | `{ type: EmbedProject, id }` | — |
| `uploadEmbedLogo` | — | `{ type: EmbedProject, id: arg.id }` |

> **Note on the analytics tag:** `embedAnalytics` shares the per-project `EmbedProject` tag with the mutations, so any project edit refetches analytics. The list-level `EmbedProjects` tag is only invalidated by `createEmbedProject` — single-project edits do not refetch the org-wide list. There is no separate "view log" endpoint exposed on the client; per-view records are aggregated server-side and surfaced via `embedAnalytics` only.

---

## API Keys

**File:** [`src/app/api/api-keys.ts`](../src/app/api/api-keys.ts)
**UI:** [`src/pages/OrgDashboard/components/ApiKeysTab.tsx`](../src/pages/OrgDashboard/components/ApiKeysTab.tsx)

| Hook | Method | URL | Args | Response |
|---|---|---|---|---|
| `useGetApiKeysQuery` | `GET` | `api-keys?orgId=…` | `orgId` | `ApiKeyResponseDto[]` |
| `useCreateApiKeyMutation` | `POST` | `api-keys` | `{ orgId, dto: ApiKeyCreateRequestDto }` | `ApiKeyResponseDto` |
| `useRevokeApiKeyMutation` | `DELETE` | `api-keys/:keyId?orgId=…` | `{ orgId, keyId }` | `void` |

All three endpoints share the cache tag `{ type: ApiTags.ApiKey, id: 'LIST-' + orgId }`: the list query provides it, both mutations invalidate it.

### Available scopes

```ts
// dto.ts
const API_KEY_SCOPES = ['embed:read', 'read:models', 'read:scenes'] as const;
```

The `ApiKeysTab` checkbox group offers all three; default selection is `['embed:read']`.

### Raw key — shown once

`ApiKeyResponseDto.rawKey` is **only populated on the create response** (`ApiKeyResponseDto.rawKey?: string | null`). Subsequent `GET /api-keys` responses return only `prefix`, never the full key.

The UI flow in `ApiKeysTab` enforces this:

1. User opens the "Создать API-ключ" modal, fills name + scopes, submits.
2. `createApiKey({ orgId, dto }).unwrap()` resolves to the new key including `rawKey`.
3. Modal title swaps to "API-ключ создан"; the key is rendered in a `<Code>` block alongside Mantine's `<CopyButton>`.
4. The modal disables `closeOnClickOutside`, `closeOnEscape`, and the close button (`withCloseButton={!createdKey}`) — the user must click "Я сохранил ключ" to dismiss, which clears `createdKey` from state. Once the modal closes, the raw key is no longer recoverable from the client; only revoke + create a new one.
5. Revoke uses Mantine's `modals.openConfirmModal` and is irreversible.

---

## EmbedViewer trust model

The public viewer is a **session-less surface**. Unlike every other page in the app, it must work inside an `<iframe>` on a third-party origin where the user has no MeshHub cookie.

| Concern | How it's handled |
|---|---|
| Auth | Query param `?apiKey=…` is read in `EmbedViewerPage` and forwarded as the `X-Api-Key` request header on the `embed/:modelId` call. |
| Origin check | Server validates the request's `Origin` / `Referer` against `EmbedProject.allowedOrigins` before responding. The client does not enforce this. |
| Cookies | The `embedViewer` request still goes through the global `Api.baseQuery`, which sets `credentials: 'include'`. In a third-party iframe context the browser typically omits the cookie anyway; the server must not rely on it. |
| Session refresh | The mutex-locked refresh path in `baseQuery` (see [`api.md`](api.md)) expects a refresh cookie. On the embed surface there is no session, so a 401 will not trigger a useful refresh — `EmbedViewerPage` treats `isError` as a terminal failure and renders the "Failed to load embed viewer" state. |

For the matching server-side enforcement (API key verification, allowed-origin matching, view logging), see [`../../server/docs/embed.md`](../../server/docs/embed.md).

---

## EmbedViewer initialization

**File:** [`src/pages/EmbedViewer/EmbedViewerPage.tsx`](../src/pages/EmbedViewer/EmbedViewerPage.tsx)

```
URL  /embed/:modelId?apiKey=…
  │
  ├── useParams → modelId
  ├── useSearchParams → apiKey
  │
  ├── useEmbedViewerQuery({ modelId, apiKey })   ← skip if either missing
  │     └── X-Api-Key header
  │
  ├── if data.type === 'model':
  │     ├── useGetDisplayConfigQuery({ modelId: data.model.id })
  │     ├── useGetMaterialsQuery({ modelId: data.model.id })
  │     └── <Model3DViewer model displayConfig materialOverrides />
  │
  ├── if data.type === 'scene':
  │     └── usePublicSceneViewer({ scene: data.scene })
  │           → renders into <Box ref={containerRef} />
  │
  └── if data.brandingConfig.showBadge:
        └── absolute "Powered by MeshHub" overlay (.badge)
```

**Branches:**
- No `apiKey` or query errors → "Failed to load embed viewer" placeholder.
- Loading or `data.type === 'model'` with `data.model` null, or `'scene'` with `data.scene` null → empty `Box` (no spinner, intentional — the surface is meant to render only valid content).
- Model branch reuses the standard [`Model3DViewer`](3d-viewer.md) widget unchanged. Display config and material overrides are fetched separately via their own RTK endpoints and applied as props.
- Scene branch uses [`usePublicSceneViewer`](../src/pages/PublicScene/hooks/usePublicSceneViewer.ts), the read-only counterpart of the editor's scene viewer hook (no transform controls, no edit callbacks; auto-plays scene-object audio if `autoplay` is set).

---

## What runs without a session on `/embed/:modelId`

The route is mounted at the router root, **outside** `BasePage` / `BaseLayout`:

| Element | On `/embed/:modelId`? | Where it normally lives |
|---|---|---|
| `BaseLayout` chrome | No | wraps every `BasePage` child route |
| `Header` | No | rendered inside `BaseLayout` |
| `NotificationBell` | No | rendered inside `Header`, gated on `useSession()` |
| `UserSidebar` | No | rendered inside `widgets/layouts/User/` for `User` routes only |
| `OrgSwitcher` | No | also `Header`-only |
| Mantine `Notifications` portal | Yes | mounted in `App.tsx` at the React root, above the router |
| Redux store + `PersistGate` | Yes | mounted in `App.tsx` — the `user.session` slice is hydrated from `localStorage` but is irrelevant when no cookie exists |
| `Theme` provider | Yes | mounted in `App.tsx` |

The page renders a single fixed-position `Box` (`position: fixed; inset: 0`) that fills the iframe viewport — see [`EmbedViewerPage.module.scss`](../src/pages/EmbedViewer/EmbedViewerPage.module.scss). The badge overlay (`.badge`) is `pointer-events: none` so it never intercepts viewer input.

---

## Customisation surface

What the project owner can configure today, derived from `EmbedProjectUpdateRequestDto` and `BrandingConfigDto`:

| Field | Type | Edited where | Read by viewer |
|---|---|---|---|
| `name` | `string` | (no UI in `EmbedProjectPage` — set at creation) | — |
| `modelId` / `sceneId` | `string \| null` | (set at creation) | drives `EmbedViewerResponseDto.type` |
| `autoRotate` | `boolean` | (no UI in `EmbedProjectPage`) | exposed on `EmbedViewerResponseDto.autoRotate`; consumer of the prop is responsible for passing it to the viewer (currently not wired through `Model3DViewer` props) |
| `brandingConfig.showBadge` | `boolean` | "Брендинг" tab `Switch` | toggles the `.badge` overlay |
| `brandingConfig.primaryColor` | `string` (hex) | "Брендинг" tab `TextInput` | available on the response; not yet applied to viewer chrome |
| `brandingConfig.logoUrl` | `string` | "Брендинг" tab `FileInput` → `uploadEmbedLogo` | available on the response; not yet rendered in `EmbedViewerPage` |
| `allowedOrigins` | `string[]` | "Домены" tab | enforced server-side, not surfaced in viewer UI |

There is no "intro animation" or autoplay-on-load field on the embed DTOs; auto-play of audio is a per-scene-object setting handled in [`usePublicSceneViewer`](../src/pages/PublicScene/hooks/usePublicSceneViewer.ts), not in the embed config.

---

## Cross-references

- [`routing.md`](routing.md) — full route tree and `RouterPaths` constants
- [`api.md`](api.md) — RTK Query base setup, cache tags, refresh mutex
- [`3d-viewer.md`](3d-viewer.md) — the `Model3DViewer` widget reused in the embed model branch
- [`../../server/docs/embed.md`](../../server/docs/embed.md) — server-side API key verification, allowed-origin matching, view analytics aggregation
