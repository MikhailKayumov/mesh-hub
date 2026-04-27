# ITER-1 — Foundation: DB + Personal Scenes & Models

## Goal

Allow users to work without an organization. Scenes and models can be owned personally (by a user) or scoped to a workspace. Both modes coexist.

## Status: 🔲 Pending

---

## Backend Changes

### 1. DB Migration — `scenes.scene`

- `workspace_id uuid` → make **nullable**
- Add `user_id uuid` FK → `users.user` (nullable, CASCADE)
- Add `visibility` as a **PG enum** (mirrors `model_3d.model_visibility`) — values: `'public'` | `'private'` | `'unlisted'`
- Add CHECK constraint: `(user_id IS NOT NULL OR workspace_id IS NOT NULL)`

```sql
CREATE TYPE scenes.scene_visibility AS ENUM('public', 'private', 'unlisted');

ALTER TABLE scenes.scene
  ALTER COLUMN workspace_id DROP NOT NULL,
  ADD COLUMN user_id uuid REFERENCES users.user(id) ON DELETE CASCADE,
  ADD COLUMN visibility scenes.scene_visibility NOT NULL DEFAULT 'private',
  ADD CONSTRAINT scene_owner_check CHECK (user_id IS NOT NULL OR workspace_id IS NOT NULL);
```

> `'unlisted'` — accessible by direct link but not shown in public listings (same semantics as `model_3d.model_visibility`).

### 2. Entity — `SceneEntity`

File: `server/src/database/entities/scenes/scene.entity.ts`

- `workspace_id` → `nullable: true`
- Add `userId: string | null` column
- Add `visibility: 'public' | 'private' | 'unlisted'` column with default `'private'`
- ManyToOne relation to `UserEntity` (nullable, CASCADE)

### 3. DTO — `SceneCreateRequestDto`

File: `server/src/modules/scenes/dto/scene.create.request.dto.ts`

- `workspaceId` → `@IsOptional()`, `@IsUUID()` (was required)
- Both `workspaceId` and `userId` are optional in the DTO; service injects `user.id` when no `workspaceId`

### 4. DTO — `SceneResponseDto` / `SceneListItemResponseDto`

File: `server/src/modules/scenes/dto/scene.response.dto.ts`

- Add `userId: string | null`
- Add `visibility: 'public' | 'private' | 'unlisted'`

### 5. Service — `ScenesService`

File: `server/src/modules/scenes/services/scenes.service.ts`

**`createScene()`** — if `dto.workspaceId` is absent → `userId = user.id`, skip `requireMember()`.

**`listScenes()`** — new optional `userId` query param:
- `GET /scenes?workspaceId=uuid` — existing workspace scope
- `GET /scenes?userId=me` — returns scenes owned by current user

**`getScene()` / `updateScene()` / `deleteScene()`** — authorization now checks either:
- workspace membership (if `workspaceId` set), OR
- ownership (`scene.userId === user.id`), OR
- scene is `public` for `getScene` only

### 6. Controller — `ScenesController`

File: `server/src/modules/scenes/controllers/scenes.controller.ts`

- `GET /scenes` — `workspaceId` query param is now `@IsOptional()`; add `userId` param (`'me'` resolved to `user.id`)

### 7. Mapper — `SceneMapper`

File: `server/src/modules/scenes/mappers/scene.mapper.ts`

- Include `userId` and `visibility` in `toResponse()` and `toListItemResponse()`

---

## Frontend Changes

### 8. Router paths

File: `client/src/shared/router/paths.ts`

- Add `UserScenes: 'scenes'` (under user namespace)
- Add `UserSceneId: ':sceneId'`

### 9. Router

File: `client/src/app/router/index.tsx`

- Add routes under `RouterPaths.User`:
  - `/user/scenes` → `UserScenesPage` (new page, lazy)
  - `/user/scenes/:sceneId` → `SceneEditorPage` (lazy, reuse existing)

### 10. UserSidebar

File: `client/src/widgets/UserSidebar/index.tsx`

- Add "Сцены" nav link (`IconMovie` icon) → `/user/scenes`

### 11. New page — `UserScenesPage`

File: `client/src/pages/UserScenes/`

- Reuse `ScenesPage` logic but without `workspaceId`
- Query: `useScenesQuery({ userId: 'me' })` (after RTK endpoint update)
- Navigate to: `/user/scenes/:sceneId`
- `CreateSceneModal` — `workspaceId` optional, omit it for personal scenes

**UI Design — scene card:**
```
┌─────────────────────────────────┐
│  [thumbnail 16:9 / placeholder] │  ← Card.Section with AspectRatio
│  📽  No preview (IconMovie)     │  ← Center fallback when no thumbnail
├─────────────────────────────────┤
│  Scene name              🟢 Public  │  ← fw=600, lineClamp=1 + visibility Badge
│  4 objects  ·  Modified 2d ago  │  ← Text size="xs" c="dimmed"
│                             ⋮   │  ← Menu trigger (3-dot)
└─────────────────────────────────┘
```

**Visibility badge colors:** `green` = public · `gray` = private · `yellow` = unlisted

**3-dot `Menu` actions:**
- Open in Editor (`IconEdit`)
- Clone scene (`IconCopy`) *(implemented in ITER-8)*
- Toggle visibility → opens `Select` inline or separate modal
- Delete (`IconTrash`, `color="red"`) → `modals.openConfirmModal()` before deleting

**Loading state:** `SimpleGrid` of 6 `Skeleton` cards (same height as real cards) while `isLoading=true`.

**Empty state:** Use the existing `EmptyData` widget:
```tsx
<EmptyData
  label="У вас ещё нет сцен"
  action={<Button leftSection={<IconPlus size={16} />} onClick={open}>Создать сцену</Button>}
/>
```

### 12. `CreateSceneModal` — workspaceId optional

File: `client/src/pages/Scenes/CreateSceneModal.tsx`

- Accept `workspaceId?: string` (was required)
- Pass to mutation only if defined

### 13. RTK Query — `scenes.ts`

File: `client/src/app/api/scenes.ts`

- `useScenesQuery` arg: `{ workspaceId?: string; userId?: string }`
- `createScene` body: `workspaceId` optional

### 14. Client DTO — `dto.ts`

File: `client/src/app/api/dto.ts`

- `SceneResponseDto` — add `userId: string | null`, `visibility: 'public' | 'private' | 'unlisted'`
- `SceneListItemResponseDto` — add `userId: string | null`, `visibility: 'public' | 'private' | 'unlisted'`
- `SceneCreateRequestDto` — `workspaceId?: string`

---

## Acceptance Criteria

- [ ] User can create a scene without being in any organization
- [ ] Personal scenes appear at `/user/scenes` with card grid + skeleton loading + empty state
- [ ] Scene card shows thumbnail, visibility badge (public/private/unlisted), object count, 3-dot menu
- [ ] Workspace scenes still work as before at `/org/:orgId/workspace/:workspaceId/scenes`
- [ ] `GET /api/scenes?userId=me` returns only current user's personal scenes
- [ ] Public scene is accessible via `GET /api/scenes/:id` without auth (visibility check)
- [ ] `'unlisted'` visibility accessible by direct link; not shown in public catalog
- [ ] DB migration runs cleanly; existing workspace scenes unaffected
- [ ] Delete scene shows confirmation dialog before proceeding
