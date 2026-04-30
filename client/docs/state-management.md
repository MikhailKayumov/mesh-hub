# State Management

The app uses **Redux Toolkit** for state management with **RTK Query** for server data fetching and **redux-persist** for selective persistence to `localStorage`.

---

## Store Configuration

**File:** `src/app/store/index.ts`

```ts
export const store = configureStore({
  reducer: {
    [Api.reducerPath]: Api.reducer, // RTK Query cache (key: '@mesh_hub/api')
    user: userReducer,              // User slice (persisted)
    org: orgReducer,                // Organization slice (persisted)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(rtkErrorLogger, Api.middleware),
  devTools: import.meta.env.DEV,   // Redux DevTools only in development
});

export const persist = persistStore(store);
```

---

## Store Shape

```ts
{
  '@mesh_hub/api': RtkQueryCacheState,  // Managed entirely by RTK Query
  user: {
    session: string | null,              // Active session ID (from cookie handshake)
    theme: ThemeName,                    // Selected color theme
  },
  org: {
    currentOrgId: string | null,         // Selected organization (persisted)
    currentWorkspaceId: string | null,   // Selected workspace within org (persisted)
  }
}
```

---

## `user` Slice

**File:** `src/entities/user/store/reducer.ts`
**Slice name:** `@mesh_hub/user`

### State Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `session` | `string \| null` | `null` | Current session ID returned by auth endpoints |
| `theme` | `ThemeName` | `'deepblue'` | Active color theme (persisted) |

### Actions

| Action creator | Payload | Description |
|---|---|---|
| `userActions.setSession` | `string \| null` | Set or clear the current session ID |
| `userActions.setTheme` | `ThemeName` | Change the active color theme |
| `userActions.reset` | — | Reset slice to initial state |

### Usage

```ts
import { userActions } from '@/entities/user/store';
import { useDispatch } from 'react-redux';

const dispatch = useDispatch();
dispatch(userActions.setSession('abc-123'));
dispatch(userActions.setTheme('darkpink'));
```

---

## `organization` Slice

**File:** `src/entities/organization/model.ts`
**Slice name:** `@mesh_hub/org`

Tracks which organization (and workspace within it) the user has selected for org-scoped pages and the `OrgSwitcher` widget. This is plain UI state — actual org/workspace records are fetched via RTK Query.

### State Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `currentOrgId` | `string \| null` | `null` | ID of the active organization |
| `currentWorkspaceId` | `string \| null` | `null` | ID of the active workspace (cleared whenever `currentOrgId` changes) |

### Actions

| Action creator | Payload | Description |
|---|---|---|
| `orgActions.setCurrentOrg` | `string \| null` | Switch active org (also resets `currentWorkspaceId` to `null`) |
| `orgActions.setCurrentWorkspace` | `string \| null` | Set active workspace within the current org |
| `orgActions.clearOrg` | — | Reset slice to initial state |

### Selectors

**File:** `src/entities/organization/selectors.ts`

| Selector | Returns |
|---|---|
| `currentOrgIdSelector` | `string \| null` |
| `currentWorkspaceIdSelector` | `string \| null` |

---

## Persistence

The store has two persisted slices, each with its own persist key and the same custom inline `WebStorage` adapter wrapping `localStorage`:

| Slice | Persist key | Persisted fields |
|---|---|---|
| `user` | `@mesh_hub/user` | `session` + `theme` |
| `org` | `@mesh_hub/org` | `currentOrgId` + `currentWorkspaceId` |

The `PersistGate` component in `App.tsx` delays rendering until the persisted state has been rehydrated:

```tsx
<PersistGate persistor={persist} loading={<>Loading</>}>
  ...
</PersistGate>
```

---

## RTK Query Integration

RTK Query manages all server data. The base `Api` instance is created in `src/app/api/base.ts` and extended with endpoints via `injectEndpoints` in separate module files.

See [`api.md`](api.md) for the full endpoint reference.

### Cache Tags

All tags are defined in `src/app/api/tags.ts` — currently **30 tag keys** (29 unique values; `Get3DModel` and `Get3DModels` deliberately share `'Get3DModels'`) covering user, model, organization, workspace, embed, scene, notification, webhook, API key, material, audio, and display-config domains. The full per-endpoint mapping (which endpoints `provideTags` / `invalidatesTags` each tag) lives in [`api.md`](api.md).

A few tags carry global semantics worth calling out:

| Tag | Purpose |
|---|---|
| `Reset` | Hard-reset sentinel — applied as a `providesTags` entry on `currentUser`, the public/owned 3D-model queries, and the CG-software / categories reference queries. Dispatching an `Api.util.invalidateTags(['Reset'])` (or any mutation that invalidates `Reset`) refetches all of them as a group. Confirmed still in use post-MVP across `src/app/api/user.ts`, `src/app/api/models-3d.ts`, and `src/app/api/resources.ts`. |
| `CurrentUser` | Authenticated user profile — invalidated by profile/password/avatar mutations |
| `Get3DModels` / `Get3DModel` | Public model list and per-model record (the latter scoped via `{ type, id }`) |

### `setupListeners`

```ts
setupListeners(store.dispatch);
```

Enables automatic refetch on window focus (`refetchOnFocus`) and network reconnect (`refetchOnReconnect`) for any RTK Query endpoint that opts in.

---

## `rtkErrorLogger` Middleware

**File:** `src/app/api/utils.ts`

A custom Redux middleware that logs RTK Query errors to the console in development. It is added **before** `Api.middleware` in the middleware chain so errors are logged before any RTK Query side-effects run.

---

## User Selectors

**File:** `src/entities/user/store/selectors.ts`

| Selector | Returns | Description |
|---|---|---|
| `selectUserSession` | `string \| null` | Current session ID |
| `selectUserTheme` | `ThemeName` | Current active theme |

(Organization selectors are documented in the [`organization` Slice](#organization-slice) section above.)

---

## Related Docs

- [`api.md`](api.md) — full RTK Query endpoint reference and complete cache-tag map
- [`organization-dashboard.md`](organization-dashboard.md) — how `currentOrgId` / `currentWorkspaceId` drive the org dashboard, `OrgSwitcher`, and workspace-scoped pages

