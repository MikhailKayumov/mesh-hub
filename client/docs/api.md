# API Reference

All API communication is handled through **RTK Query**, injected into a single `Api` instance. This document covers the cache tag system, all endpoint modules, request/response DTOs, and the token auto-refresh flow.

> **Backend context:** The NestJS server exposes these endpoints from the following modules: `auth`, `user`, `models-3d`, `resources`, `organizations`, `workspaces`, `api-keys`, `embed`, `reviews`, `versions`, `scenes`. Server source lives in `../server/src/modules/`.

---

## Base Configuration

**File:** `src/app/api/base.ts`

| Setting | Value |
|---|---|
| `reducerPath` | `'@mesh_hub/api'` |
| `baseUrl` | `import.meta.env.VITE_APP_API_URL ?? '/'` |
| `credentials` | `'include'` (cookie-based sessions) |
| `timeout` | `30 000 ms` |

---

## Cache Tags (`ApiTags`)

**File:** `src/app/api/tags.ts`

| Key | Value | Note |
|---|---|---|
| `Reset` | `'Reset'` | Global invalidation sentinel — forces `currentUser` and `model3D` to refetch |
| `CurrentUser` | `'CurrentUser'` | Current authenticated user data |
| `CGSoft` | `'CGSoft'` | CG software reference list |
| `Categories` | `'Categories'` | 3D model categories list |
| `Get3DModels` | `'Get3DModels'` | Public paginated model list |
| `Get3DModel` | `'Get3DModels'` | ⚠ Same value as `Get3DModels` — used for per-ID tag `{ type, id }` |
| `CurrentUser3DModels` | `'CurrentUser3DModels'` | Current user's uploaded models list |
| `CurrentUser3DModel` | `'CurrentUser3DModel'` | (reserved, not currently used in provides) |
| `Organization` | `'Organization'` | Single organization record |
| `OrgMembers` | `'OrgMembers'` | Organization member list |
| `OrgSubscription` | `'OrgSubscription'` | Organization subscription + storage config |
| `Workspaces` | `'Workspaces'` | Workspace list (org-scoped) |
| `Workspace` | `'Workspace'` | Single workspace record |
| `EmbedProjects` | `'EmbedProjects'` | Embed project list (org-scoped) |
| `EmbedProject` | `'EmbedProject'` | Single embed project record |
| `Comments` | `'Comments'` | Model comment list |
| `Annotations` | `'Annotations'` | Model annotation list |
| `ModelVersions` | `'ModelVersions'` | Model version list |
| `Scenes` | `'Scenes'` | Scene list (workspace-scoped) |
| `Scene` | `'Scene'` | Single scene record |

### Tag Provider / Invalidator Map

| Endpoint | Provides | Invalidates |
|---|---|---|
| `currentUser` | `Reset`, `CurrentUser` | — |
| `currentUserSessions` | `CurrentUser` | — |
| `model3D` | `Reset`, `{ type: Get3DModel, id }` | — |
| `models3D` | `Get3DModels` | — |
| `currentUser3DModels` | `Reset`, `CurrentUser3DModels` | — |
| `cgSoft` | `Reset`, `CGSoft` | — |
| `categories` | `Reset`, `Categories` | — |
| `register` / `login` / `logout` | — | `CurrentUser`, `Get3DModel` |
| `closeCurrentUserSession` | — | `CurrentUser` |
| `closeCurrentUserSessions` | — | `CurrentUser`, `Get3DModel` |
| `updateCurrentUser` | — | `CurrentUser`, `CGSoft` |
| `updateCurrentUserAvatar` | — | `CurrentUser` |
| `updateModel3D` | — | `Reset`, `Get3DModels`, `{ type: Get3DModel, id }` |
| `upload3DModel` / `delete3DModel` / `saveThumbnailFromBase64` | — | `CurrentUser3DModels`, `Get3DModels` |

> **`Reset` tag:** Invalidating it causes all queries that provide `Reset` to refetch simultaneously. Use it only for hard resets (e.g. after closing all sessions).

---

## Auth API

**File:** `src/app/api/auth.ts`
**Server module:** `auth`

| Hook | Method | URL | Request DTO | Response DTO |
|---|---|---|---|---|
| `useRegisterMutation` | `POST` | `auth/signup` | `SignupRequestDto` | `SessionResponseDto` |
| `useLoginMutation` | `POST` | `auth/login` | `LoginRequestDto` | `SessionResponseDto` |
| `useLogoutMutation` | `POST` | `auth/logout` | — | `void` |
| `useCurrentUserSessionsQuery` | `GET` | `auth/current-user-sessions` | `PaginationDto<never>` | `PaginationResponseDto<SessionResponseDto>` |
| `useCloseCurrentUserSessionMutation` | `DELETE` | `auth/current-user-sessions/:id` | `string` (id) | `void` |
| `useCloseCurrentUserSessionsMutation` | `DELETE` | `auth/current-user-sessions` | — | `void` |

---

## User API

**File:** `src/app/api/user.ts`
**Server module:** `user`

| Hook | Method | URL | Request DTO | Response DTO |
|---|---|---|---|---|
| `useCurrentUserQuery` | `GET` | `user/current` | — | `UserCurrentResponseDto` |
| `useUpdateCurrentUserMutation` | `PATCH` | `user/current` | `UserCurrentUpdateRequestDto` | `void` |
| `useUpdateCurrentUserAvatarMutation` | `POST` | `user/current/avatar` | `{ file?: Blob }` | `void` |
| `useResetPasswordMutation` | `PATCH` | `user/reset-password` | `{ email: string }` | `void` |
| `useNewPasswordMutation` | `PATCH` | `user/new-password` | `UserNewPasswordRequestDto` | `void` |
| `useChangePasswordMutation` | `PATCH` | `user/change-password` | `UserChangePasswordRequestDto` | `void` |

---

## Models 3D API

**File:** `src/app/api/models-3d.ts`
**Server module:** `models-3d`

| Hook | Method | URL | Request | Response |
|---|---|---|---|---|
| `useModels3DQuery` | `GET` | `models-3d` | `PaginationDto<any>` | `PaginationResponseDto<Model3DResponseDto>` |
| `useModel3DQuery` | `GET` | `models-3d/:id` | `string` (id) | `Model3DResponseDto` |
| `useUpdateModel3DMutation` | `PATCH` | `models-3d/:id` | `{ id, body: Model3DUpdateRequestDto }` | `Model3DResponseDto` |
| `useCurrentUser3DModelsQuery` | `GET` | `models-3d/current-user` | `PaginationDto<any>` | `PaginationResponseDto<Model3DResponseDto>` |
| `useUpload3DModelMutation` | `POST` | `models-3d/upload` | `FormData` | `{ modelId: string }` |
| `useDelete3DModelMutation` | `DELETE` | `models-3d/:id` | `string` (id) | `void` |
| `useSaveThumbnailFromBase64Mutation` | `POST` | `models-3d/:id/save-thumbnail-base64` | `{ id, thumbnail: string }` | `void` |

---

## Resources API

**File:** `src/app/api/resources.ts`
**Server module:** `resources`

| Hook | Method | URL | Request | Response |
|---|---|---|---|---|
| `useCgSoftQuery` | `GET` | `resources/cg-soft/all` | — | `CgSoftResponse[]` |
| `useCategoriesQuery` | `GET` | `resources/category/all` | — | `CategoryResponse[]` |

These are reference data endpoints (CG software list, model categories). Both provide the `Reset` tag, so they refetch on hard resets.

---

## Organizations API

**File:** `src/app/api/organizations.ts`
**Server module:** `organizations`

| Hook | Method | URL | Request | Response |
|---|---|---|---|-|
| `useCreateOrganizationMutation` | `POST` | `organizations` | `CreateOrgDto` | `OrgResponseDto` |
| `useMyOrganizationsQuery` | `GET` | `organizations/current` | — | `OrgResponseDto[]` |
| `useOrganizationQuery` | `GET` | `organizations/:id` | `string` (id) | `OrgResponseDto` |
| `useUpdateOrganizationMutation` | `PATCH` | `organizations/:id` | `{ id, body }` | `OrgResponseDto` |
| `useOrgMembersQuery` | `GET` | `organizations/:id/members` | `string` (id) | `OrgMemberResponseDto[]` |
| `useInviteOrgMemberMutation` | `POST` | `organizations/:id/invite` | `{ id, body: InviteOrgMemberDto }` | `void` |
| `useAcceptOrgInviteMutation` | `POST` | `organizations/invite/accept` | `{ token: string }` | `void` |
| `useChangeOrgMemberRoleMutation` | `PATCH` | `organizations/:id/members/:userId` | `{ id, userId, role }` | `void` |
| `useRemoveOrgMemberMutation` | `DELETE` | `organizations/:id/members/:userId` | `{ id, userId }` | `void` |
| `useGetOrgSubscriptionQuery` | `GET` | `organizations/:id/subscription` | `string` (id) | `OrgSubscriptionResponseDto` |
| `useUpdateOrgStorageConfigMutation` | `PATCH` | `organizations/:id/subscription/storage` | `{ id, body }` | `void` |

---

## Workspaces API

**File:** `src/app/api/workspaces.ts`
**Server module:** `workspaces`

| Hook | Method | URL | Request | Response |
|---|---|---|---|-|
| `useCreateWorkspaceMutation` | `POST` | `workspaces` | `CreateWorkspaceDto` | `WorkspaceResponseDto` |
| `useMyWorkspacesQuery` | `GET` | `workspaces?orgId=` | `string` (orgId) | `WorkspaceResponseDto[]` |
| `useWorkspaceQuery` | `GET` | `workspaces/:id` | `string` (id) | `WorkspaceResponseDto` |
| `useUpdateWorkspaceMutation` | `PATCH` | `workspaces/:id` | `{ id, body }` | `WorkspaceResponseDto` |
| `useDeleteWorkspaceMutation` | `DELETE` | `workspaces/:id` | `string` (id) | `void` |
| `useAddWorkspaceMemberMutation` | `POST` | `workspaces/:id/members` | `{ id, userId }` | `void` |
| `useRemoveWorkspaceMemberMutation` | `DELETE` | `workspaces/:id/members/:userId` | `{ id, userId }` | `void` |

---

## Reviews API

**File:** `src/app/api/reviews.ts`
**Server module:** `reviews`

### Comments

| Hook | Method | URL | Request | Response |
|---|---|---|---|-|
| `useModelCommentsQuery` | `GET` | `models-3d/:modelId/comments` | `{ modelId, ...pagination }` | `PaginationResponseDto<ModelCommentResponseDto>` |
| `useAddCommentMutation` | `POST` | `models-3d/:modelId/comments` | `{ modelId, body: CreateCommentDto }` | `ModelCommentResponseDto` |
| `useUpdateCommentMutation` | `PATCH` | `models-3d/:modelId/comments/:id` | `{ modelId, id, body }` | `void` |
| `useDeleteCommentMutation` | `DELETE` | `models-3d/:modelId/comments/:id` | `{ modelId, id }` | `void` |

### Annotations

| Hook | Method | URL | Request | Response |
|---|---|---|---|-|
| `useModelAnnotationsQuery` | `GET` | `models-3d/:modelId/annotations` | `string` (modelId) | `ModelAnnotationResponseDto[]` |
| `useCreateAnnotationMutation` | `POST` | `models-3d/:modelId/annotations` | `{ modelId, body: CreateAnnotationDto }` | `ModelAnnotationResponseDto` |
| `useUpdateAnnotationMutation` | `PATCH` | `models-3d/:modelId/annotations/:id` | `{ modelId, id, body }` | `void` |
| `useDeleteAnnotationMutation` | `DELETE` | `models-3d/:modelId/annotations/:id` | `{ modelId, id }` | `void` |
| `useReorderAnnotationsMutation` | `PUT` | `models-3d/:modelId/annotations/reorder` | `{ modelId, ids: string[] }` | `void` |

---

## Model Versions API

**File:** `src/app/api/versions.ts`
**Server module:** `versions`

| Hook | Method | URL | Request | Response |
|---|---|---|---|-|
| `useModelVersionsQuery` | `GET` | `models-3d/:modelId/versions` | `string` (modelId) | `ModelVersionResponseDto[]` |
| `useUploadVersionMutation` | `POST` | `models-3d/:modelId/versions` | `{ modelId, file: FormData }` | `ModelVersionResponseDto` |
| `useActivateVersionMutation` | `PATCH` | `models-3d/:modelId/versions/:versionId/activate` | `{ modelId, versionId }` | `void` |
| `useDeleteVersionMutation` | `DELETE` | `models-3d/:modelId/versions/:versionId` | `{ modelId, versionId }` | `void` |

---

## Embed API

**File:** `src/app/api/embed.ts`
**Server module:** `embed`

| Hook | Method | URL | Request | Response |
|---|---|---|---|-|
| `useEmbedViewerQuery` | `GET` | `embed/:modelId` | `string` (modelId) | `EmbedViewerResponseDto` |
| `useEmbedProjectsQuery` | `GET` | `embed/projects?orgId=` | `string` (orgId) | `EmbedProjectResponseDto[]` |
| `useCreateEmbedProjectMutation` | `POST` | `embed/projects` | `CreateEmbedProjectDto` | `EmbedProjectResponseDto` |
| `useUpdateEmbedProjectMutation` | `PATCH` | `embed/projects/:id` | `{ id, body }` | `EmbedProjectResponseDto` |
| `useAddEmbedDomainMutation` | `POST` | `embed/projects/:id/domains` | `{ id, domain: string }` | `void` |
| `useRemoveEmbedDomainMutation` | `DELETE` | `embed/projects/:id/domains/:domain` | `{ id, domain }` | `void` |
| `useEmbedAnalyticsQuery` | `GET` | `embed/projects/:id/analytics` | `{ id, ...pagination }` | `PaginationResponseDto<ModelViewLogDto>` |
| `useUploadEmbedLogoMutation` | `POST` | `embed/projects/:id/logo` | `{ id, file: FormData }` | `void` |

---

## Scenes API

**File:** `src/app/api/scenes.ts`
**Server module:** `scenes`

| Hook | Method | URL | Request | Response |
|---|---|---|---|-|
| `useScenesQuery` | `GET` | `scenes?workspaceId=` | `string` (workspaceId) | `SceneListItemResponseDto[]` |
| `useSceneQuery` | `GET` | `scenes/:id` | `string` (id) | `SceneResponseDto` |
| `useCreateSceneMutation` | `POST` | `scenes` | `CreateSceneDto` | `SceneListItemResponseDto` |
| `useUpdateSceneMutation` | `PATCH` | `scenes/:id` | `{ id, body }` | `void` |
| `useDeleteSceneMutation` | `DELETE` | `scenes/:id` | `string` (id) | `void` |
| `useAddSceneObjectMutation` | `POST` | `scenes/:id/objects` | `{ id, body: AddSceneObjectDto }` | `SceneObjectResponseDto` |
| `useUpdateSceneObjectMutation` | `PATCH` | `scenes/:id/objects/:objId` | `{ id, objId, body }` | `void` |
| `useRemoveSceneObjectMutation` | `DELETE` | `scenes/:id/objects/:objId` | `{ id, objId }` | `void` |
| `useAddSceneLightMutation` | `POST` | `scenes/:id/lights` | `{ id, body: AddSceneLightDto }` | `SceneLightResponseDto` |
| `useUpdateSceneLightMutation` | `PATCH` | `scenes/:id/lights/:lightId` | `{ id, lightId, body }` | `void` |
| `useRemoveSceneLightMutation` | `DELETE` | `scenes/:id/lights/:lightId` | `{ id, lightId }` | `void` |
| `useUploadSceneThumbnailMutation` | `POST` | `scenes/:id/thumbnail` | `{ id, thumbnail: string }` | `void` |

---

## Data Transfer Objects (DTOs)

**File:** `src/app/api/dto.ts`

### Pagination

```ts
interface PaginationDto<T = any> {
  skip?: number;
  size?: number;
  sort?: string[];
  body?: T;
}

interface PaginationResponseDto<T = any> {
  data: T[];
  skip: number;
  size: number;
  sort: PaginationDtoSortItem[];  // { field: string; by: 'ASC' | 'DESC' }
  totalCount: number;
  hasMore: boolean;
}
```

### Auth

```ts
interface SignupRequestDto {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}

interface LoginRequestDto {
  email: string;
  password: string;
}

interface SessionResponseDto {
  id: string;
  ip: string;
  createdAt: string;
  updatedAt?: string;
  expireAt: string;
  userAgent?: string;
}
```

### User

```ts
interface UserCurrentResponseDto {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  isConfirmed: boolean;
  meta: UserMetaResponseDto;
}

interface UserMetaResponseDto {
  id: string;
  avatar?: string;
  aboutYourself?: string;
  favoriteSoft?: CgSoftResponse[];
}

interface UserCurrentUpdateRequestDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  aboutYourself?: string;
  favoriteSoft?: CgSoftRequest[];
}
```

### 3D Models

```ts
interface Model3DResponseDto {
  id: string;
  createdAt: string;
  updatedAt?: string;
  isOwner: boolean;
  ownerAvatar?: string;
  ownerName: string;
  name: string;
  isVisible: boolean;
  file: Model3DFileResponseDto;  // { id, name, size, extension, createdAt, updatedAt }
  description?: Record<string, any>;
  thumbnail?: string;
  categories?: CategoryResponse[];
}

interface Model3DUpdateRequestDto {
  name?: string;
  isVisible?: boolean;
  description?: object;
  categories?: CategoryRequest[];
}
```

### Errors

```ts
interface HttpException {
  status: number;
  type?: string;
  message: string;
  error: string;
  data?: any;
}

interface ValidationHttpException<Property = string> {
  status: 400;
  type: 'ValidationError';
  message: 'Ошибка валидации';
  error: 'Bad Request';
  data: { property: Property; errors: string[] }[];
}
```

---

## Token Auto-Refresh Flow

The base query in `src/app/api/base.ts` handles session refresh automatically using `async-mutex` to prevent concurrent refresh races.

```
Any RTK Query request
  │
  ▼
Execute base fetch
  │
  ├─ Success → return result
  │
  └─ Error (401 or network error)
       │
       ├─ Mutex already locked by another refresh?
       │    └─ Wait for unlock → retry original request → return result
       │
       └─ Mutex is free → acquire lock
            │
            ▼
          POST auth/refresh
            │
            ├─ Success → dispatch setSession(newId)
            │               → retry original request → return result
            │
            └─ Failure → dispatch setSession(null)  ← clears session state
            │
            └─ Release mutex (always, in finally)
```

**Key properties:**
- Only one refresh attempt runs at a time across all in-flight requests
- If a second request arrives during an ongoing refresh, it waits then retries with the new session cookie
- On refresh failure the `user.session` slice is set to `null`, which allows the UI to show an unauthenticated state

