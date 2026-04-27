# ITER-7 — Review & Annotations: Scenes + Access Control

## Goal

Full review system for both models and scenes: 3D annotation pins, threaded comments, access control by visibility/membership, and a public review mode for shared models and scenes.

## Status: 🔲 Pending

---

## Current state

| Feature | Models | Scenes |
|---|---|---|
| 3D Annotations (backend) | ✅ | ❌ |
| Annotations UI | ✅ (Editor) | ❌ |
| Comments (backend) | ✅ | ❌ |
| Comments UI | ✅ (Editor) | ❌ |
| Public review access | ❌ | ❌ |

---

## Backend Changes

### 1. DB Migration — Scene Annotations

New table: `scenes.scene_annotation` (mirrors `model_annotation`)

```sql
CREATE TABLE scenes.scene_annotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid NOT NULL REFERENCES scenes.scene(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users.user(id),
  pos_x float8 NOT NULL,
  pos_y float8 NOT NULL,
  pos_z float8 NOT NULL,
  scene_object_id uuid REFERENCES scenes.scene_object(id) ON DELETE SET NULL,
  text text NOT NULL,
  order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
```

`scene_object_id` — optional, links annotation to a specific object in the scene for highlighting.

### 2. DB Migration — Scene Comments

New table: `scenes.scene_comment` (mirrors `model_comment`)

```sql
CREATE TABLE scenes.scene_comment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid NOT NULL REFERENCES scenes.scene(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users.user(id),
  parent_id uuid REFERENCES scenes.scene_comment(id),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
```

### 3. Backend — Scene Annotations submodule

`server/src/modules/scenes/annotations/`

Endpoints (mirror model annotations):
- `POST /scenes/:id/annotations`
- `GET /scenes/:id/annotations`
- `PATCH /scenes/:id/annotations/:annotId`
- `DELETE /scenes/:id/annotations/:annotId`
- `PUT /scenes/:id/annotations/order` — bulk reorder

### 4. Backend — Scene Comments submodule

`server/src/modules/scenes/comments/`

Endpoints:
- `POST /scenes/:id/comments`
- `GET /scenes/:id/comments`
- `PATCH /scenes/:id/comments/:commentId`
- `DELETE /scenes/:id/comments/:commentId`

### 5. Access control — `@OptionalUser()` pattern

For `GET` scene/model + annotations/comments:
- If resource is `public` (visibility = 'public') → allow without auth
- If resource is workspace-scoped → require workspace membership
- If resource is user-owned → require ownership or public

Use `@OptionalUser()` decorator on GET endpoints; service checks:

```ts
async canRead(sceneOrModel, user?: UserEntity): Promise<void> {
  if (resource.visibility === 'public') return;      // public → always ok
  if (!user) throw new ForbiddenException();
  if (resource.userId && resource.userId === user.id) return;  // own personal resource
  if (resource.workspaceId) await this.requireMember(resource.workspaceId, user.id);
}
```

---

## Frontend Changes

### 6. Scene Editor — "Review" tab

Add 4th tab to Scene Editor navbar: **Objects | Lights | Config | Review** (icon: `IconMessage`, `Tooltip label="Review"`)

File: `client/src/pages/SceneEditor/panels/SceneReviewPanel.tsx`

- Top section: 3D Annotation pins list using Mantine `Timeline`:
  ```tsx
  <Timeline active={selectedAnnotId ? annotations.findIndex(a => a.id === selectedAnnotId) : -1}>
    {annotations.map((ann, i) => (
      <Timeline.Item key={ann.id} title={`Pin ${i + 1}`} bullet={<IconMapPin size={12} />}>
        <Text size="sm">{ann.text}</Text>
        <Group gap={4} mt={4}>
          <Avatar size="xs" src={ann.user.avatarUrl} />
          <Text size="xs" c="dimmed">{ann.user.name}</Text>
        </Group>
      </Timeline.Item>
    ))}
  </Timeline>
  ```
- "Annotate" mode toggle → `viewer.setMode('annotate')` → click in viewport places pin
- `sceneObjectId` captured from raycast `object.userData.sceneObjectId`
- Click annotation in list → camera flies to pin; highlighted object outlined
- Bottom section: `ReviewPanel` widget (comments thread)
- **Empty state** (no annotations yet): `EmptyData` with "Click Annotate to add the first pin" CTA

### 7. RTK Query — scene annotations + comments

File: `client/src/app/api/scenes.ts` (extend)

- `useSceneAnnotationsQuery(sceneId)`
- `useAddSceneAnnotationMutation()`
- `useUpdateSceneAnnotationMutation()`
- `useRemoveSceneAnnotationMutation()`
- `useReorderSceneAnnotationsMutation()`
- `useSceneCommentsQuery(sceneId)`
- `useAddSceneCommentMutation()`
- `useUpdateSceneCommentMutation()`
- `useDeleteSceneCommentMutation()`

### 8. Public Scene View page

New page: `client/src/pages/PublicScene/`

Route: `/scenes/:sceneId` (added to router, `@Public()` on backend)

- Loads scene via `useSceneQuery(sceneId)` (no org/workspace in URL)
- Full viewport + `SceneViewer` (read-only, no editing)
- Right side panel: `ReviewPanel` (comments; write if authenticated, read-only if not)
- Annotation pins shown in viewport with labels
- Header: scene name, author, "Open in Editor" button (if user has access)

**Access denied state** (private scene, user does not have access):
```tsx
<Center h="100dvh">
  <Stack align="center" gap="md">
    <IconLock size={48} color="var(--mantine-color-dimmed)" />
    <Title order={3}>Private Scene</Title>
    <Text c="dimmed">This scene is private. Request access from the owner.</Text>
    <Button variant="light" component={Link} to="/scenes">Browse Public Scenes</Button>
  </Stack>
</Center>
```

**Mobile layout** (< 768px breakpoint):
- Hide aside panel by default
- Show `Drawer` (position="right", size="90vw") with `ReviewPanel` inside
- Trigger: `ActionIcon` with `IconMessage` floating above viewport (`position: fixed, bottom: 80px, right: 16px`)
- Use `useMediaQuery('(max-width: 768px)')` or Mantine `hiddenFrom`/`visibleFrom` props

### 9. Public Model Page — Review toggle

File: `client/src/pages/Models3D/pages/Model3D/` (existing public model page)

- Add "Review" button in model page header
- Expands `ReviewPanel` + `AnnotationManager` (view mode) below/beside the viewer
- Accessible if model is public OR user has workspace access

---

## Acceptance Criteria

- [ ] Scene has Annotations: add pins in viewport, list in Review tab as `Timeline` component
- [ ] Scene annotations link to specific objects (highlight on click)
- [ ] Scene has Comments: threaded, editable/deletable by author
- [ ] Public scene accessible at `/scenes/:id` without auth (if visibility = 'public')
- [ ] Private scene shows access-denied state (`IconLock` + message + CTA) instead of blank page
- [ ] Public model page shows review panel for public models
- [ ] Workspace members can review workspace-scoped private models/scenes
- [ ] Anonymous users can read annotations/comments on public resources
- [ ] Authenticated non-members cannot access private workspace resources
- [ ] On mobile, review panel is in a `Drawer` triggered by floating action button
