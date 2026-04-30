# Notifications

## Scope

The notifications domain provides **two distinct delivery channels** routed through one global module:

| Channel | Service | Storage | Use case |
|---|---|---|---|
| In-app | `InAppNotificationsService` | `notifications.notification` table | User-facing inbox; per-user list, unread count, mark-read |
| Email (SMTP) | `NotificationsService` (delegates to `EmailGatewayService`) | None — fire-and-forget | Transactional outbound mail (invites, password resets) |

Both services are exported from a `@Global()` module ([notifications.module.ts](../src/modules/notifications/notifications.module.ts)) — any feature module can inject them without an explicit `imports` entry.

There is no in-app/email pairing logic: a caller picks the channel(s) explicitly. A single business event may dispatch one, the other, both, or neither (see [Integration Points](#integration-points)).

The companion module [`EmailGatewayModule`](../src/modules/notifications/gateways/email-gateway/email-gateway.module.ts) wraps `@nestjs-modules/mailer` and is the only place SMTP lives.

---

## Entity

`NotificationEntity` ([notification.entity.ts](../src/database/entities/notifications/notification.entity.ts)) extends `GuidIdEntityBase` — adds `id` (uuid), `createdAt`, `updatedAt`, `deletedAt`. Schema/table: `notifications.notification`.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `uuid` | no | PK, default `uuid_generate_v4()` |
| `user_id` | `uuid` | no | FK → `users.user(id)`, `ON DELETE CASCADE` |
| `type` | `varchar(50)` | no | One of [Notification Kinds](#notification-kinds) |
| `payload` | `jsonb` | no | Free-form, kind-specific (see kinds table) |
| `is_read` | `boolean` | no | Default `false`; flipped by mark-read endpoints |
| `created_at` | `timestamptz` | no | Default `now()` |
| `updated_at` | `timestamptz` | yes | Default `now()` |
| `deleted_at` | `timestamptz` | yes | Soft-delete; `findForUser` filters `IS NULL` |

Indexes:

| Name | Columns | Source |
|---|---|---|
| `IDX_af4870a2f8b5443a1fe1aecd4c` | `(user_id, is_read)` | `@Index(['userId', 'isRead'])` on the entity |

Note: the entity has **no `title` or `body` columns**. UI labels are derived client-side from `type` + `payload`. Schema/table names come from `DatabaseSchemas.Notifications` / `NotificationsSchemaTables.Notification` in [database/constants.ts](../src/database/constants.ts).

---

## Notification Kinds

Defined as a `const` object in the entity file ([notification.entity.ts:6](../src/database/entities/notifications/notification.entity.ts#L6)). The TS type also accepts `string & {}`, so unknown kinds are allowed at compile time but should not be introduced casually.

| Kind constant | DB value | Trigger | Payload fields | Call site |
|---|---|---|---|---|
| `NotificationTypes.CommentAdded` | `comment_added` | New comment on a 3D model — sent to model owner if owner ≠ author | `{ modelId, commentId, authorId }` | [reviews.service.ts:77](../src/modules/reviews/services/reviews.service.ts#L77) |
| `NotificationTypes.CommentAdded` | `comment_added` | New comment on a personal scene — sent to scene owner if owner ≠ author (org-owned scenes go via webhook only) | `{ sceneId, commentId, authorId }` | [scene-comments.service.ts:71](../src/modules/scenes/comments/scene-comments.service.ts#L71) |
| `NotificationTypes.InviteAccepted` | `invite_accepted` | A pending org invite is accepted — sent to org owner if owner ≠ accepter | `{ orgId, userId }` | [organization.service.ts:308](../src/modules/organizations/services/organization.service.ts#L308) |
| `NotificationTypes.ModelUploaded` | `model_uploaded` | **Declared, not yet wired.** No `inAppNotificationsService.create(...)` call uses this kind. The corresponding `model.uploaded` webhook is dispatched at [model-3d.service.ts:54](../src/modules/models-3d/services/model-3d.service.ts#L54), but no in-app notification is created. | _n/a_ | _none_ |
| `NotificationTypes.ModelVersionProcessed` | `model_version_processed` | **Declared, not yet wired.** No producer in the codebase. | _n/a_ | _none_ |

Add a new kind by:
1. Extending `NotificationTypes` in [notification.entity.ts](../src/database/entities/notifications/notification.entity.ts).
2. Calling `inAppNotificationsService.create(userId, NotificationTypes.<New>, payload)` from the originating service.
3. Updating any client-side display map.

No migration is required when adding a kind — `type` is a free `varchar(50)`.

---

## Endpoints

All routes are mounted under `/notifications` ([in-app-notifications.controller.ts](../src/modules/notifications/controllers/in-app-notifications.controller.ts)). Auth: global `JwtAuthGuard` + `@Roles([UserRoles.User])` on every method (i.e. any authenticated user; users only see their own rows). Owner is taken from `@User()` (decoded from the access cookie).

| Method | Path | Description | Response |
|---|---|---|---|
| `GET` | `/notifications` | List up to 50 notifications for the current user, unread first then by `createdAt DESC`, soft-deleted excluded | `200` `NotificationResponseDto[]` |
| `GET` | `/notifications/unread-count` | Count rows where `user_id = current AND is_read = false` | `200` `{ count: number }` |
| `PATCH` | `/notifications/read-all` | Mark all unread rows for the current user as read | `204` |
| `PATCH` | `/notifications/:id/read` | Mark one owned notification as read; `404` if id is not owned by the caller | `204` |

Response DTOs ([notification.response.dto.ts](../src/modules/notifications/dto/notification.response.dto.ts)):

```typescript
class NotificationResponseDto {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

class UnreadCountResponseDto {
  count: number;
}
```

The mapper ([in-app-notification.mapper.ts](../src/modules/notifications/mappers/in-app-notification.mapper.ts)) is a plain class with a static `toResponse(entity)` method — strips `userId`, `updatedAt`, `deletedAt` from the entity.

Repository methods ([in-app-notification.repository.ts](../src/modules/notifications/repositories/in-app-notification.repository.ts)) — the only place SQL for notifications lives:

| Method | Behaviour |
|---|---|
| `findForUser(userId, limit = 50)` | Soft-delete filter, `ORDER BY isRead ASC, createdAt DESC` |
| `findOneOwned(id, userId)` | Used by `markRead` to enforce ownership before update |
| `countUnread(userId)` | Backs `unread-count` |
| `markRead(id, userId)` | `UPDATE ... SET is_read = true WHERE id = ? AND user_id = ?` |
| `markAllRead(userId)` | `UPDATE ... SET is_read = true WHERE user_id = ? AND is_read = false` |

Marking an already-read row is a no-op (short-circuited in the service before hitting the DB).

There is **no create endpoint** — notifications are produced internally by other services calling `InAppNotificationsService.create(userId, type, payload)`. There is no delete endpoint either; the repository inherits soft-delete from `Repository<NotificationEntity>` but no controller action exposes it.

---

## Email Transport

```
Caller                                NotificationsService
  │                                     │
  ├── sendEmail(to, subject, text) ────►│  1. Empty/falsy `to` → silent return
  │                                     │  2. emailGatewayService.sendEmail(...)
  │                                     │       │
  │                                     │       └─► MailerService.sendMail({ to, subject, text })
  │                                     │              │
  │                                     │              └─► Nodemailer (SMTP transport from ConfigService.mailerConfig)
  │                                     │
  │◄────── result | null on error ──────┤  Errors are caught, logged, and converted to null
```

Source files:

| File | Role |
|---|---|
| [notifications.service.ts](../src/modules/notifications/notifications.service.ts) | Public surface; only one method: `sendEmail(to, subject, text)`. Skips empty arrays / falsy addresses. |
| [gateways/email-gateway/email-gateway.module.ts](../src/modules/notifications/gateways/email-gateway/email-gateway.module.ts) | Registers `MailerModule.forRootAsync` with `ConfigService.mailerConfig` |
| [gateways/email-gateway/email-gateway.service.ts](../src/modules/notifications/gateways/email-gateway/email-gateway.service.ts) | Wraps `MailerService.sendMail`; logs request + result; on throw, logs the error and returns `null` |

Transport config ([config.service.ts:122](../src/modules/config/config.service.ts#L122)):

- Implementation: `@nestjs-modules/mailer` over Nodemailer; SMTP target is Yandex when `SMTP_YANDEX_ENABLED=true`.
- When disabled, host falls back to `localhost:25` with `ignoreTLS=true` and `preview=true`, which routes to the Nodemailer preview-email handler instead of an actual SMTP server (useful for local dev).
- `from` is built as `"<SMTP_YANDEX_SENDER_NAME>" <SMTP_YANDEX_AUTH_USER>`.
- Env vars (`SMTP_YANDEX_*`) are documented in [configuration.md](configuration.md).

Templates: **not used.** All call sites pass plain text bodies built inline (string concatenation with frontend URLs). There is no `templates/` directory in the module, no Handlebars/Pug/EJS engine wired into `MailerOptions`, and no `template:`/`context:` arguments on `sendMail` calls. The only `templates/` path on disk lives inside `node_modules/preview-email/`, which is unrelated.

---

## Queueing

**No BullMQ.** Email and in-app dispatch are synchronous within the request handler.

Searches for `@Process(`, `@Processor(`, `BullModule.registerQueue`, and `new Queue(` find matches **only** under [`src/modules/organizations/webhooks/`](../src/modules/organizations/webhooks) (the unrelated webhook delivery system) — no notification or email queue is registered.

Reliability strategy at the call sites is "fire-and-forget":

| Call site | Pattern | Failure mode |
|---|---|---|
| Org invite email | `notificationsService.sendEmail(...).catch((e) => logger.error(...))` ([organization.service.ts:266](../src/modules/organizations/services/organization.service.ts#L266)) | Email lost; HTTP request still succeeds |
| Password reset email | `.then(...).catch(...)` ([user.service.ts:137](../src/modules/user/services/user.service.ts#L137)) | Email lost; request still succeeds |
| Comment / invite-accepted in-app | `void this.fireXTriggers(...)` wrapping `try/catch` per dispatch | Notification lost; logged at `warn` level |

If a queued, retryable pipeline becomes a requirement, the natural place to add it is a new BullMQ queue inside `EmailGatewayModule` (mirroring `webhooks/processors/`), keeping `NotificationsService.sendEmail` as the public surface.

---

## Integration Points

| Triggering module | Event | Channel | Kind / Subject | Call site |
|---|---|---|---|---|
| `organizations` | Org owner/admin invites a user | Email | Subject: `You're invited to join <org> on MeshHub` | [organization.service.ts:266](../src/modules/organizations/services/organization.service.ts#L266) |
| `organizations` | Pending invite is accepted | In-app (org owner) | `InviteAccepted` — `{ orgId, userId }` | [organization.service.ts:308](../src/modules/organizations/services/organization.service.ts#L308) |
| `reviews` (model comments) | Comment added to a 3D model | In-app (model owner, if ≠ author) | `CommentAdded` — `{ modelId, commentId, authorId }` | [reviews.service.ts:77](../src/modules/reviews/services/reviews.service.ts#L77) |
| `scenes/comments` | Comment added to a personal scene | In-app (scene owner, if ≠ author) | `CommentAdded` — `{ sceneId, commentId, authorId }` | [scene-comments.service.ts:71](../src/modules/scenes/comments/scene-comments.service.ts#L71) |
| `user` | Password reset requested | Email | Subject: `Сброс пароля`; body contains `<frontendUrl>/auth/new-password?request=<id>` | [user.service.ts:137](../src/modules/user/services/user.service.ts#L137) |
| `auth` | Successful login | _disabled_ | The send call is commented out at [auth.service.ts:78](../src/modules/auth/auth.service.ts#L78) | — |

Events explicitly **not** wired through this module:

- **Org webhook delivery failure** — there is no notification emitted. Failures are persisted to `webhook_delivery_log` only (see [`organizations/webhooks/`](../src/modules/organizations/webhooks)).
- **Embed API key creation** — no notification or email. The embed module ([`embed/`](../src/modules/embed)) does not import `NotificationsService` or `InAppNotificationsService`.
- **Model uploaded** — only a webhook is fired ([model-3d.service.ts:54](../src/modules/models-3d/services/model-3d.service.ts#L54)); the `ModelUploaded` notification kind is declared but unused.
- **Model version processed** — `ModelVersionProcessed` is declared but has no producer.

---

## Cross-references

- [auth.md](auth.md) — password-reset flow and session model; the email side of password reset is described above and routed through the same `NotificationsService`.
- [configuration.md](configuration.md) — `SMTP_YANDEX_*` env vars consumed by `ConfigService.mailerConfig`.
- [database.md](database.md) — schema map (`notifications` schema) and entity-base inheritance.
- [modules.md](modules.md) — module dependency graph, including the `@Global()` placement of `NotificationsModule`.
- `organizations.md` — invite lifecycle that fires `Email` + `InviteAccepted` in-app pairs (cross-doc; covers the surrounding org logic). _No file at this path yet — content lives in [modules.md](modules.md) until split._
- `embed.md` — embed-projects + API keys (no notifications today; cross-doc; pending split).

---

## Conventions

- Always inject `InAppNotificationsService` for inbox writes; never instantiate `NotificationEntity` outside the module.
- Always inject `NotificationsService` for email; never call `MailerService` or `EmailGatewayService` directly from feature modules.
- Wrap dispatch in `void` + `try/catch` (or `.catch(...)`) — a downstream send failure must not fail the originating request.
- Notification payloads are user-readable on the client; keep keys stable across releases. Adding a key is safe; removing or renaming is a breaking client change.
- Do not store rendered titles/bodies in the DB — the entity has no such columns. The client renders from `type` + `payload`.
