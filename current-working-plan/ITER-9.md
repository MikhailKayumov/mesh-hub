# ITER-9 — Embed & Integrations

## Goal

Embed viewer supports scenes in addition to models. In-app notification system. Webhook delivery for external automation. API key scopes expansion. (AR/USDZ export is post-MVP.)

## Status: 🔲 Pending

---

## Embed — Scene Support

### 1. DB Migration — `embed_project.scene_id`

```sql
ALTER TABLE embed.embed_project
  ADD COLUMN scene_id uuid REFERENCES scenes.scene(id) ON DELETE SET NULL;

ALTER TABLE embed.embed_project
  ADD CONSTRAINT embed_project_target_check
    CHECK (num_nonnulls(model_id, scene_id) = 1);
```

> **Why `num_nonnulls()`:** PostgreSQL built-in that counts non-null arguments. This enforces exactly one of `model_id` / `scene_id` is set at DB level (not just service level), making it impossible to create an embed with neither or both targets.

### 2. Backend — `EmbedProjectsService`

- `createEmbedProject(dto)` — accept `sceneId` OR `modelId` (not both)
- `getPublicEmbed(projectId, apiKey)` — detect type; return `{ type: 'model' | 'scene', id, config }`
- `EmbedProjectCreateRequestDto` — add `sceneId?: UUID`, `@ValidateIf` mutual exclusion

### 3. Frontend — Embed Viewer (`EmbedViewer` page)

File: `client/src/pages/EmbedViewer/EmbedViewerPage.tsx`

```ts
if (embed.type === 'model') {
  viewer.loadModel(embed.resourceUrl, embed.config);
} else {
  viewer.loadScene(embed.sceneId, embed.config);
}
```

Both render in same `Model3DViewer` / `SceneViewer` canvas; config (theme, logo, controls) applies to both.

### 4. Frontend — Embed Project creation form

File: `client/src/pages/EmbedProject/CreateEmbedProjectModal.tsx`

**Embed type selector** — use `Radio.Group` with `Radio.Card` (Mantine 9):
```tsx
<Radio.Group value={embedType} onChange={setEmbedType}>
  <SimpleGrid cols={2} mt="xs">
    <Radio.Card value="model" p="md" radius="md">
      <Group wrap="nowrap">
        <Radio.Indicator />
        <Stack gap={4}>
          <IconCube size={24} />
          <Text fw={600} size="sm">3D Model</Text>
          <Text size="xs" c="dimmed">Embed a single model</Text>
        </Stack>
      </Group>
    </Radio.Card>
    <Radio.Card value="scene" p="md" radius="md">
      <Group wrap="nowrap">
        <Radio.Indicator />
        <Stack gap={4}>
          <IconMovie size={24} />
          <Text fw={600} size="sm">Scene</Text>
          <Text size="xs" c="dimmed">Embed a composed scene</Text>
        </Stack>
      </Group>
    </Radio.Card>
  </SimpleGrid>
</Radio.Group>
```

- Conditionally show model selector OR scene selector based on `embedType`
- Scene selector: `useWorkspaceScenesQuery(workspaceId)` → Combobox

**Empty embed project list**: render `EmptyData` widget with "Create your first embed project" label + "New Embed" CTA button.

---

## In-App Notifications

### 5. DB Migration — `notifications.notification`

```sql
CREATE SCHEMA IF NOT EXISTS notifications;

CREATE TABLE notifications.notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users.user(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,   -- 'comment', 'invite_accepted', 'model_upload_done', etc.
  payload jsonb NOT NULL,      -- { modelId, sceneId, commentId, orgId, message }
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON notifications.notification (user_id, is_read);
```

### 6. Backend — Notifications module

`server/src/modules/notifications/`

- `NotificationService.create(userId, type, payload)` — internal, called by other services
- `GET /notifications` — authenticated; returns unread first
- `PATCH /notifications/:id/read` — mark single as read
- `PATCH /notifications/read-all` — mark all as read
- `GET /notifications/unread-count` — returns `{ count: number }`

**Trigger points** (no new libs needed — call `NotificationService` from existing services):
- New comment on own model/scene → notify model/scene owner
- New comment on thread user participated in → notify thread participants
- Org invite accepted → notify org owner
- Model version processing complete (if async processing added)

### 7. Frontend — Notification bell

File: `client/src/widgets/Header/`

**Bell with unread badge** — wrap in Mantine `Indicator`:
```tsx
<Indicator
  label={count > 9 ? '9+' : String(count)}
  size={16}
  disabled={count === 0}
  color="red"
  processing={isPolling && count === 0}
>
  <ActionIcon variant="subtle" size="lg" aria-label="Notifications">
    <IconBell size={20} />
  </ActionIcon>
</Indicator>
```

**Notification Popover:**
```tsx
<Popover width={360} shadow="md" position="bottom-end">
  <Popover.Target>{bell with Indicator}</Popover.Target>
  <Popover.Dropdown p={0}>
    <Group justify="space-between" p="sm"
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Text fw={600}>Notifications</Text>
      <Anchor size="xs" onClick={markAllRead}>Mark all read</Anchor>
    </Group>
    <ScrollArea mah={400}>
      <Stack gap={0}>
        {notifications.length === 0 && (
          <EmptyData label="No notifications yet" py="xl" />
        )}
        {notifications.map(n => (
          <UnstyledButton key={n.id} p="sm"
            style={{ opacity: n.isRead ? 0.6 : 1 }}
            onClick={() => { markRead(n.id); navigate(buildLink(n)); }}>
            <Group>
              <ThemeIcon size="sm" variant="light">{typeIcon(n.type)}</ThemeIcon>
              <Box flex={1}>
                <Text size="sm" lineClamp={2}>{n.payload.message}</Text>
                <Text size="xs" c="dimmed">{relativeTime(n.createdAt)}</Text>
              </Box>
              {!n.isRead && <Badge size="xs" color="blue">new</Badge>}
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </ScrollArea>
  </Popover.Dropdown>
</Popover>
```

- Mark as read on open
- `useUnreadCountQuery()` polling every 60s (or websocket in post-MVP)

RTK Query:
- `useNotificationsQuery()` — list
- `useUnreadCountQuery()` — count (polled)
- `useMarkReadMutation(id)`
- `useMarkAllReadMutation()`

---

## Webhooks

### 8. DB Migration — `organizations.webhook`

```sql
CREATE TABLE organizations.webhook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations.organization(id) ON DELETE CASCADE,
  url text NOT NULL,
  events text[] NOT NULL,  -- ['model.uploaded', 'comment.added', 'scene.created']
  secret varchar(255) NOT NULL,  -- AES-256-CBC encrypted (use decrypt() before signing)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organizations.webhook_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES organizations.webhook(id) ON DELETE CASCADE,
  event varchar(50) NOT NULL,
  payload jsonb NOT NULL,
  response_status int,
  delivered_at timestamptz,
  failed_at timestamptz
);
```

> **Secret storage:** On webhook creation, generate a random 32-byte hex secret and encrypt it with AES-256-CBC using the same `encrypt()`/`decrypt()` utility already used for `org_subscription` S3 credentials. Store the encrypted value. Show the **raw secret ONCE** to the user after creation — never retrievable again (same pattern as API keys).

### 9. Backend — Webhooks module

`server/src/modules/organizations/webhooks/`

- `POST /organizations/:id/webhooks` — register; admin only; returns `{ secret }` once
- `GET /organizations/:id/webhooks` — list (no secret shown)
- `DELETE /organizations/:id/webhooks/:webhookId` — revoke
- `GET /organizations/:id/webhooks/:webhookId/deliveries` — delivery log

`WebhookDeliveryService`:
- Called from relevant services after events
- Signs payload:
  ```ts
  // WRONG — hashes are one-way; cannot sign HMAC with a stored hash:
  // crypto.createHmac('sha256', webhook.secret).update(...).digest('hex')

  // CORRECT — decrypt first, then sign:
  const rawSecret = decrypt(webhook.secret); // same AES utility as org_subscription S3 creds
  const signature = crypto.createHmac('sha256', rawSecret)
    .update(JSON.stringify(body))
    .digest('hex');
  // Include in request header: X-Webhook-Signature: sha256=<signature>
  ```
- Sends POST to webhook URL with `X-Webhook-Signature` header; saves delivery log
- Uses Bull queue to not block request: `@InjectQueue('webhooks') private webhookQueue`

### 10. Frontend — Webhooks Settings

File: `client/src/pages/OrgDashboard/pages/OrgSettings/tabs/WebhooksTab.tsx`

- Add "Webhooks" tab in Org Settings
- List existing webhooks (URL, events, status)
- "Add Webhook" button → modal (URL, event checkboxes, generate secret)
- Show secret ONCE after creation (copy to clipboard, then never shown again)
- Delivery log table (last 20 deliveries per webhook)

---

## API Keys — Scopes Expansion

### 11. DB Migration — `embed.api_key.scopes`

```sql
ALTER TABLE embed.api_key
  ADD COLUMN scopes text[] NOT NULL DEFAULT '{embed:read}';
```

### 12. Backend — scope enforcement

Supported scopes:
- `embed:read` — view embed projects (existing behavior)
- `read:models` — read model list/details (public endpoint bypass for org models)
- `read:scenes` — read scene list/details

`ApiKeyGuard` reads `req.apiKey.scopes` and checks against required scope per endpoint:

```ts
@RequiredScope('read:models')
@Get('/models-3d')
async listModels() { ... }
```

### 13. Frontend — API Key creation UI

File: existing API Keys management page in Org settings

- Scope checkboxes on "Create API Key" modal
- Show scopes list on existing key rows

---

## Acceptance Criteria

### Embed
- [ ] Embed project has `CHECK (num_nonnulls(model_id, scene_id) = 1)` DB constraint
- [ ] Embed project creation uses `Radio.Card` type selector (Model / Scene)
- [ ] Embed project supports scene selection (scene_id)
- [ ] Embed viewer loads a scene when `type='scene'`
- [ ] Empty embed list renders `EmptyData` widget with CTA

### Notifications
- [ ] Bell shows unread count via Mantine `Indicator` (disabled when 0, "9+" when > 9)
- [ ] Notification popover (360px) shows list with `ScrollArea mah={400}`, empty `EmptyData`, mark-all-read link
- [ ] Comment on model/scene notifies owner
- [ ] Invite accepted notifies org owner
- [ ] Mark as read works (single + all)

### Webhooks
- [ ] Webhook secret AES-encrypted (using same utility as `org_subscription`), shown once, never retrievable
- [ ] `WebhookDeliveryService` decrypts secret before HMAC signing (not using hash)
- [ ] `model.uploaded` event delivered with signed payload (`X-Webhook-Signature` header)
- [ ] `comment.added` event delivered
- [ ] Delivery log shows success/failure per delivery
- [ ] Queue-based delivery (non-blocking)

### API Keys
- [ ] Key creation shows scope checkboxes
- [ ] `read:models` scope allows listing org models via API key
- [ ] Requests without required scope return `403 Forbidden`
