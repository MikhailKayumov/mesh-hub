# Notifications (Client)

In-app notifications surface for the MeshHub React client. Renders a Mantine bell with an unread badge in the global header. Clicking opens a popover dropdown of recent notifications with mark-as-read and mark-all-read controls.

> **Producer side:** Server emits notification rows; see [`../../server/docs/notifications.md`](../../server/docs/notifications.md).

---

## Scope

| Concern | Owner |
|---|---|
| Bell UI + badge | `widgets/NotificationBell` |
| Recent list dropdown | `widgets/NotificationBell` (Mantine `Popover.Dropdown`) |
| Polling unread count | RTK Query `pollingInterval` on `useGetUnreadCountQuery` |
| Mark-read / mark-all-read | RTK mutations from `app/api/notifications.ts` |
| Mounting | `widgets/Header` (rendered inside `widgets/layouts/Base`) |
| Per-notification routing | `buildLink(NotificationDto)` inside the bell widget |

There is **no dedicated context provider** for notifications — the bell consumes the RTK Query cache directly. The list and count are global RTK cache entries, so any future consumer (e.g. a full-page inbox) can subscribe to the same queries without duplicating fetches.

---

## Widget Layout

**File:** [`../src/widgets/NotificationBell/NotificationBell.tsx`](../src/widgets/NotificationBell/NotificationBell.tsx)
**Public surface:** [`../src/widgets/NotificationBell/index.tsx`](../src/widgets/NotificationBell/index.tsx) — re-exports `NotificationBell`.

JSX shape (top-down):

```
<Popover width={360} shadow="md" position="bottom-end">
  <Popover.Target>
    <Indicator label={count > 9 ? '9+' : String(count)} disabled={count === 0} color="red">
      <Tooltip label="Уведомления">
        <ActionIcon variant="subtle" size="lg" aria-label="Уведомления">
          <IconBell size={20} />
        </ActionIcon>
      </Tooltip>
    </Indicator>
  </Popover.Target>
  <Popover.Dropdown p={0}>
    <Group> {/* header: title + "Mark all read" Anchor */} </Group>
    <ScrollArea.Autosize mah={400}>
      <Stack gap={0}>
        {/* EmptyData when list is empty */}
        {/* UnstyledButton row per notification */}
      </Stack>
    </ScrollArea.Autosize>
  </Popover.Dropdown>
</Popover>
```

Per-row composition:

| Slot | Component | Notes |
|---|---|---|
| Trigger | `UnstyledButton` | Whole row clickable; `opacity: 0.6` when `isRead` |
| Icon | `ThemeIcon size="sm" variant="light"` | Inner icon picked by `typeIcon(type)` |
| Body | `Text size="sm" lineClamp={2}` | Message from `getMessage(n)` |
| Timestamp | `Text size="xs" c="dimmed"` | `dayjs(n.createdAt).fromNow()` |
| Unread marker | `Badge size="xs" color="blue"` | Label `"новое"`; rendered only when `!n.isRead` |

The dropdown header uses an inline `borderBottom: '1px solid var(--mantine-color-default-border)'` — there is no SCSS module for this widget.

---

## Polling Cadence

**Where:** `NotificationBell.tsx` line 29, 92–94.

```ts
const POLL_INTERVAL_MS = 60_000;
const { data: countData } = useGetUnreadCountQuery(undefined, {
  pollingInterval: POLL_INTERVAL_MS,
});
```

| Setting | Value | Notes |
|---|---|---|
| `pollingInterval` (unread count) | `60 000 ms` | Local constant `POLL_INTERVAL_MS` |
| `pollingInterval` (notifications list) | — | Not polled. List refetches only via tag invalidation after `markRead` / `markAllRead` |
| `refetchOnFocus` / `refetchOnReconnect` | Inherited from `Api` defaults in [`../src/app/api/base.ts`](../src/app/api/base.ts) | Not overridden by this widget |

The list does not poll — the count poll drives the badge, and any user action that mutates state invalidates both tags so the dropdown is current the next time it is opened.

---

## API Surface

**File:** [`../src/app/api/notifications.ts`](../src/app/api/notifications.ts)
**Tags file:** [`../src/app/api/tags.ts`](../src/app/api/tags.ts) — exports `ApiTags.Notification`, `ApiTags.NotificationCount`.

### Endpoints

| Hook | Method | URL | Request | Response |
|---|---|---|---|---|
| `useGetNotificationsQuery` | `GET` | `notifications` | — | `NotificationDto[]` |
| `useGetUnreadCountQuery` | `GET` | `notifications/unread-count` | — | `UnreadCountResponseDto` |
| `useMarkNotificationReadMutation` | `PATCH` | `notifications/:id/read` | `{ id: string }` | `void` |
| `useMarkAllNotificationsReadMutation` | `PATCH` | `notifications/read-all` | — | `void` |

`getNotifications` is a **flat array**, not paginated — there is no `PaginationDto`/`PaginationResponseDto` envelope. The server is expected to cap the result; the client just renders whatever it gets inside the `ScrollArea.Autosize mah={400}` viewport.

### Cache Tags

| Tag | Provided by | Tag id |
|---|---|---|
| `Notification` | `getNotifications` | `'LIST'` |
| `NotificationCount` | `getUnreadCount` | `'COUNT'` |

### Invalidation Map

| Mutation | Invalidates |
|---|---|
| `markNotificationRead` | `{ Notification, 'LIST' }`, `{ NotificationCount, 'COUNT' }` |
| `markAllNotificationsRead` | `{ Notification, 'LIST' }`, `{ NotificationCount, 'COUNT' }` |

---

## DTOs

**File:** [`../src/app/api/dto.ts`](../src/app/api/dto.ts) (lines 793–803).

```ts
export interface NotificationDto {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponseDto {
  count: number;
}
```

`type` is a string discriminator (no exhaustive union on the wire). `payload` is an opaque map — the bell widget reads `message`, `sceneId`, `modelId`, `orgId` from it, but the type is `Record<string, unknown>` so producers can extend it freely. New fields are picked up by the widget only after explicit code changes.

---

## Notification Kinds

The widget recognises four `type` values, declared as a local const in `NotificationBell.tsx`:

```ts
const NotificationTypes = {
  CommentAdded: 'comment_added',
  InviteAccepted: 'invite_accepted',
  ModelUploaded: 'model_uploaded',
  ModelVersionProcessed: 'model_version_processed',
} as const;
```

| `type` | Icon (`@tabler/icons-react`) | Default message (when `payload.message` is empty) |
|---|---|---|
| `comment_added` | `IconMessageCircle` | `"Новый комментарий"` |
| `invite_accepted` | `IconBuilding` | `"Приглашение принято"` |
| `model_uploaded` | `IconCube` | `"Загружена новая модель"` |
| `model_version_processed` | `IconPhoto` | `"Версия модели обработана"` |
| _(unknown)_ | `IconMovie` | `"Уведомление"` |

If `payload.message` is a non-empty string, it overrides the default message regardless of `type` (see `getMessage(n)`).

### Routing on Click

`buildLink(n)` reads the payload in this priority order (first match wins):

| Payload field | Target route |
|---|---|
| `payload.sceneId: string` | `/scenes/:sceneId` |
| `payload.modelId: string` | `/models-3d/:modelId` |
| `payload.orgId: string` | `/org/:orgId` |
| _(none)_ | No navigation — only mark-read fires |

Cross-link the producer side ([`../../server/docs/notifications.md`](../../server/docs/notifications.md)) for which `type` values the server actually emits and the canonical `payload` shape per kind.

---

## Mark-Read Flow

```ts
const handleClickItem = async (n: NotificationDto) => {
  if (!n.isRead) {
    try {
      await markRead({ id: n.id }).unwrap();
    } catch {
      // ignore
    }
  }
  const link = buildLink(n);
  if (link) {
    navigate(link);
  }
};
```

| Step | Behaviour |
|---|---|
| 1. Click row | `handleClickItem(n)` runs |
| 2. If unread | `markNotificationRead({ id })` — awaited via `.unwrap()` |
| 3. Tag invalidation | `Notification` + `NotificationCount` tags refetch the list and count |
| 4. Navigate | `navigate(buildLink(n))` if a target was resolved |

There is **no optimistic update** — the widget relies on RTK Query tag invalidation to refresh both the list (so the row's `isRead` flips) and the badge count. Errors are silently swallowed. Mark-all-read uses the same pattern via `handleMarkAll`.

---

## Empty / Loading States

| State | Render |
|---|---|
| Empty list | `<EmptyData label="Нет уведомлений" labelSize="sm" width={120} height={75} />` wrapped in a `Box py="xl" px="md"` |
| Initial load | None — `useGetNotificationsQuery()` defaults `data` to `[]` via `data: notifications = []`, so the empty state shows transiently before first response. No skeleton |
| Mutation pending | None — buttons remain enabled |
| Error | None — caught and ignored |

`EmptyData` is the project's standard empty-state widget; see [`widgets.md`](widgets.md) → "EmptyData".

The bell does not gate on `isLoading` / `isFetching`; the dropdown is always renderable. This matches the "lightweight chrome" pattern used elsewhere for header widgets — see `client/AGENTS.md` UI conventions.

---

## Where It's Mounted

**File:** [`../src/widgets/Header/index.tsx`](../src/widgets/Header/index.tsx) line 33.

```tsx
{session && <NotificationBell />}
```

| Condition | Behaviour |
|---|---|
| `useSession()` truthy | Bell renders alongside `OrgSwitcher`, `SearchInput`, `User` |
| `useSession()` falsy | Bell hidden; auth buttons rendered instead |

The header itself is mounted by `widgets/layouts/Base` (`AppShell.Header` slot), used by `pages/Base` (`BasePage`). All authenticated routes nest under `BasePage` in [`../src/app/router/index.tsx`](../src/app/router/index.tsx).

The `EmbedViewer` route (`RouterPaths.Embed → :modelId`) is registered as a **sibling** of the `BasePage` tree (router/index.tsx lines 153–161), not a child — so the Embed page renders without the global header and the bell does not appear. This is intentional: embed sessions are unauthenticated (API-key-based), there is no user context, and the unread-count poll would have no caller identity to scope by.

---

## Cross-References

- [`widgets.md`](widgets.md) — full widget catalogue (entry: `NotificationBell` belongs in the "User & Auth" / global chrome group).
- [`api.md`](api.md) — RTK Query base, full cache-tag table, refresh mutex flow.
- [`state-management.md`](state-management.md) — store wiring and `Api` reducer registration.
- [`../../server/docs/notifications.md`](../../server/docs/notifications.md) — server-side producer: which events emit which `type`, payload shape per kind, persistence schema.
