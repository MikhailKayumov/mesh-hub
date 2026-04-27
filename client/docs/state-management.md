# State Management

The app uses **Redux Toolkit** for state management with **RTK Query** for server data fetching and **redux-persist** for selective persistence to `localStorage`.

---

## Store Configuration

**File:** `src/app/store/index.ts`

```ts
export const store = configureStore({
  reducer: {
    '@mesh_hub/api': Api.reducer,   // RTK Query cache
    user: userReducer,              // User slice (persisted)
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

## Persistence

**Persist key:** `@mesh_hub/user`
**Storage:** `localStorage` (custom inline `WebStorage` adapter)
**Persisted fields:** all fields in `user` slice (`session` + `theme`)

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

All tags are defined in `src/app/api/tags.ts`:

| Tag | Value | Purpose |
|---|---|---|
| `Reset` | `'Reset'` | Hard-reset sentinel: all queries providing it refetch |
| `CurrentUser` | `'CurrentUser'` | Authenticated user profile |
| `CGSoft` | `'CGSoft'` | CG software reference list |
| `Categories` | `'Categories'` | Model category list |
| `Get3DModels` | `'Get3DModels'` | Public paginated model list |
| `Get3DModel` | `'Get3DModels'` | Per-model tag `{ type, id }` (same value) |
| `CurrentUser3DModels` | `'CurrentUser3DModels'` | Current user model list |
| `CurrentUser3DModel` | `'CurrentUser3DModel'` | (reserved) |
| `Organization` | `'Organization'` | Single org record |
| `OrgMembers` | `'OrgMembers'` | Org member list |
| `OrgSubscription` | `'OrgSubscription'` | Subscription + storage config |
| `Workspaces` | `'Workspaces'` | Workspace list |
| `Workspace` | `'Workspace'` | Single workspace |
| `EmbedProjects` | `'EmbedProjects'` | Embed project list |
| `EmbedProject` | `'EmbedProject'` | Single embed project |
| `Comments` | `'Comments'` | Model comment list |
| `Annotations` | `'Annotations'` | Model annotation list |
| `ModelVersions` | `'ModelVersions'` | Model version list |
| `Scenes` | `'Scenes'` | Scene list |
| `Scene` | `'Scene'` | Single scene record |

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

## Selectors

**File:** `src/entities/user/store/selectors.ts`

| Selector | Returns | Description |
|---|---|---|
| `selectUserSession` | `string \| null` | Current session ID |
| `selectUserTheme` | `ThemeName` | Current active theme |

