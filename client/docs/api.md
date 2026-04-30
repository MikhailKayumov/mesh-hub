# API Reference

All API communication is handled through **RTK Query**, injected into a single `Api` instance. This document covers the cache tag system, all endpoint modules, request/response DTOs, and the token auto-refresh flow.

> **Backend context:** The NestJS server exposes these endpoints from the following modules: `auth`, `user`, `models-3d`, `resources`, `organizations`, `workspaces`, `api-keys`, `embed`, `reviews`, `versions`, `scenes`, `scene-reviews`, `display-config`, `materials`, `audio`, `notifications`, `webhooks`. Server source lives in `../server/src/modules/`. See [../../server/docs/api.md](../../server/docs/api.md) for backend conventions.

---

## Base Configuration

**File:** `src/app/api/base.ts`

| Setting | Value |
|---|---|
| `reducerPath` | `'@mesh_hub/api'` |
| `baseUrl` | `import.meta.env.VITE_APP_API_URL ?? '/'` |
| `credentials` | `'include'` (cookie-based sessions) |
| `timeout` | `30 000 ms` |

All endpoints are added through `Api.injectEndpoints({ ..., overrideExisting: true })` — never via a second `createApi`. Auth is read from the HttpOnly cookie set by the server; no `Authorization` header is sent.

---

## Cache Tags (`ApiTags`)

**File:** `src/app/api/tags.ts` — 30 tag keys (29 unique values; `Get3DModel` and `Get3DModels` deliberately share `'Get3DModels'`).

### User & Auth

| Key | Value | Note |
|---|---|---|
| `Reset` | `'Reset'` | Global invalidation sentinel — forces queries that provide it (`currentUser`, `model3D`, `currentUser3DModels`, `cgSoft`, `categories`) to refetch |
| `CurrentUser` | `'CurrentUser'` | Current authenticated user data + sessions |
| `CGSoft` | `'CGSoft'` | CG software reference list |
| `Categories` | `'Categories'` | 3D model categories list |

### 3D Models

| Key | Value | Note |
|---|---|---|
| `Get3DModels` | `'Get3DModels'` | Public paginated model list |
| `Get3DModel` | `'Get3DModels'` | Same value as `Get3DModels`; used for per-ID tag `{ type, id }` |
| `CurrentUser3DModels` | `'CurrentUser3DModels'` | Current user's uploaded models list |
| `CurrentUser3DModel` | `'CurrentUser3DModel'` | Reserved for per-model owner cache (not used in `provides` today) |

### Organization

| Key | Value | Note |
|---|---|---|
| `Organization` | `'Organization'` | Single organization record + `myOrganizations` list |
| `OrgMembers` | `'OrgMembers'` | Per-organization member list, scoped by `{ type, id: orgId }` |
| `OrgSubscription` | `'OrgSubscription'` | Per-organization subscription + storage config, scoped by `{ type, id: orgId }` |

### Workspaces

| Key | Value | Note |
|---|---|---|
| `Workspaces` | `'Workspaces'` | Workspace list (org-scoped via query params) |
| `Workspace` | `'Workspace'` | Single workspace record, scoped by `{ type, id }` |

### Embed

| Key | Value | Note |
|---|---|---|
| `EmbedProjects` | `'EmbedProjects'` | Embed project list per organization, scoped by `{ type, id: orgId }` |
| `EmbedProject` | `'EmbedProject'` | Single embed project (covers config, domains, analytics) |

### Comments / Annotations (Models)

| Key | Value | Note |
|---|---|---|
| `Comments` | `'Comments'` | Model comment list, scoped by `{ type, id: modelId }` |
| `Annotations` | `'Annotations'` | Model annotation list, scoped by `{ type, id: modelId }` |

### Versions

| Key | Value | Note |
|---|---|---|
| `ModelVersions` | `'ModelVersions'` | Model version history, scoped by `{ type, id: modelId }` |

### Scenes

| Key | Value | Note |
|---|---|---|
| `Scenes` | `'Scenes'` | Scene list, scoped by `{ type, id: workspaceId | userId | 'personal' }` |
| `Scene` | `'Scene'` | Single scene record (objects, lights, config), scoped by `{ type, id: sceneId }` |
| `SceneAnnotations` | `'SceneAnnotations'` | Scene annotation list, scoped by `{ type, id: sceneId }` |
| `SceneComments` | `'SceneComments'` | Scene comment list, scoped by `{ type, id: sceneId }` |

### Display Config / Materials / Audio

| Key | Value | Note |
|---|---|---|
| `DisplayConfig` | `'DisplayConfig'` | Per-model display config (env, lights, postprocessing), scoped by `{ type, id: modelId }` |
| `Materials` | `'Materials'` | Per-model material override list, scoped by `{ type, id: modelId }` |
| `ModelAudio` | `'ModelAudio'` | Per-model audio asset list, scoped by `{ type, id: modelId }` |

### Notifications

| Key | Value | Note |
|---|---|---|
| `Notification` | `'Notification'` | Notification list, scoped by `{ type, id: 'LIST' }` |
| `NotificationCount` | `'NotificationCount'` | Unread badge counter, scoped by `{ type, id: 'COUNT' }` |

### Webhooks

| Key | Value | Note |
|---|---|---|
| `Webhook` | `'Webhook'` | Webhook list per organization, scoped by `{ type, id: 'LIST-${orgId}' }` |
| `WebhookDeliveries` | `'WebhookDeliveries'` | Per-webhook delivery log, scoped by `{ type, id: webhookId }` |

### API Keys

| Key | Value | Note |
|---|---|---|
| `ApiKey` | `'ApiKey'` | Per-organization API key list, scoped by `{ type, id: 'LIST-${orgId}' }` |

> **`Reset` tag:** Invalidating it causes all queries that provide `Reset` to refetch simultaneously. Use it only for hard resets (e.g. after closing all sessions or replacing the active model).

---

## Auth API

**File:** `src/app/api/auth.ts` · **Server module:** `auth`

All endpoints are public (no JWT required); successful login/register sets the HttpOnly cookie.

| Hook | Method | URL | Request DTO | Response DTO | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useRegisterMutation` | `POST` | `auth/signup` | `SignupRequestDto` | `SessionResponseDto` | — | `CurrentUser`, `Get3DModel` |
| `useLoginMutation` | `POST` | `auth/login` | `LoginRequestDto` | `SessionResponseDto` | — | `CurrentUser`, `Get3DModel` |
| `useLogoutMutation` | `POST` | `auth/logout` | — | `void` | — | `CurrentUser`, `Get3DModel` |
| `useCurrentUserSessionsQuery` | `GET` | `auth/current-user-sessions` | `PaginationDto<never>` | `PaginationResponseDto<SessionResponseDto>` | `CurrentUser` | — |
| `useCloseCurrentUserSessionMutation` | `DELETE` | `auth/current-user-sessions/:id` | `string` (id) | `void` | — | `CurrentUser` |
| `useCloseCurrentUserSessionsMutation` | `DELETE` | `auth/current-user-sessions` | — | `void` | — | `CurrentUser`, `Get3DModel` |

---

## User API

**File:** `src/app/api/user.ts` · **Server module:** `user`

| Hook | Method | URL | Request DTO | Response DTO | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useCurrentUserQuery` | `GET` | `user/current` | — | `UserCurrentResponseDto` | `Reset`, `CurrentUser` | — |
| `useUpdateCurrentUserMutation` | `PATCH` | `user/current` | `UserCurrentUpdateRequestDto` | `void` | — | `CurrentUser`, `CGSoft` |
| `useUpdateCurrentUserAvatarMutation` | `POST` | `user/current/avatar` | `{ file?: Blob }` (multipart) | `void` | — | `CurrentUser` |
| `useResetPasswordMutation` | `PATCH` | `user/reset-password` | `string` (email) | `void` | — | — |
| `useNewPasswordMutation` | `PATCH` | `user/new-password` | `UserNewPasswordRequestDto` | `void` | — | — |
| `useChangePasswordMutation` | `PATCH` | `user/change-password` | `UserChangePasswordRequestDto` | `void` | — | — |

---

## Models 3D API

**File:** `src/app/api/models-3d.ts` · **Server module:** `models-3d`

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useModels3DQuery` | `GET` | `models-3d` | `Models3DQueryParams` (`PaginationDto & { workspaceId?, search? }`) | `PaginationResponseDto<Model3DResponseDto>` | `Get3DModels` | — |
| `useModel3DQuery` | `GET` | `models-3d/:id` | `string` (id) | `Model3DResponseDto` | `Reset`, `{ Get3DModel, id }` | — |
| `useUpdateModel3DMutation` | `PATCH` | `models-3d/:id` | `{ id, body: Model3DUpdateRequestDto }` | `Model3DResponseDto` | — | `Reset`, `Get3DModels`, `{ Get3DModel, id }` |
| `useCurrentUser3DModelsQuery` | `GET` | `models-3d/current-user` | `PaginationDto<any>` | `PaginationResponseDto<Model3DResponseDto>` | `Reset`, `CurrentUser3DModels` | — |
| `useDelete3DModelMutation` | `DELETE` | `models-3d/:id` | `string` (id) | `void` | — | `CurrentUser3DModels`, `Get3DModels` |
| `useSaveThumbnailFromBase64Mutation` | `POST` | `models-3d/:id/save-thumbnail-base64` | `{ id, thumbnail: string }` | `void` | — | `CurrentUser3DModels`, `Get3DModels` |
| `useGetScenesUsingModelQuery` | `GET` | `scenes/using-model/:modelId` | `string` (modelId) | `SceneListItemResponseDto[]` | `{ Scenes, id: 'using-model:${modelId}' }` | — |

> The `uploadModel3DWithProgress` XHR helper (in `entities/model3d/`, not in this folder) bypasses RTK and dispatches `Get3DModels` + `CurrentUser3DModels` invalidations manually after success.

---

## Resources API

**File:** `src/app/api/resources.ts` · **Server module:** `resources`

| Hook | Method | URL | Request | Response | Provides |
|---|---|---|---|---|---|
| `useCgSoftQuery` | `GET` | `resources/cg-soft/all` | — | `CgSoftResponse[]` | `Reset`, `CGSoft` |
| `useCategoriesQuery` | `GET` | `resources/category/all` | — | `CategoryResponse[]` | `Reset`, `Categories` |

Reference data — both refetch on hard reset.

---

## Organizations API

**File:** `src/app/api/organizations.ts` · **Server module:** `organizations`

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useCreateOrganizationMutation` | `POST` | `organizations` | `OrganizationCreateRequestDto` | `OrganizationResponseDto` | — | `Organization` |
| `useMyOrganizationsQuery` | `GET` | `organizations/current` | — | `OrganizationResponseDto[]` | `Organization` | — |
| `useOrganizationQuery` | `GET` | `organizations/:id` | `string` (id) | `OrganizationResponseDto` | `{ Organization, id }` | — |
| `useUpdateOrganizationMutation` | `PATCH` | `organizations/:id` | `{ id, body: OrganizationUpdateRequestDto }` | `OrganizationResponseDto` | — | `{ Organization, id }` |
| `useOrgMembersQuery` | `GET` | `organizations/:id/members` | `{ id } & PaginationDto` | `PaginationResponseDto<OrgMemberResponseDto>` | `{ OrgMembers, id }` | — |
| `useInviteOrgMemberMutation` | `POST` | `organizations/:id/invite` | `{ id, body: OrgInviteCreateRequestDto }` | `void` | — | `{ OrgMembers, id }` |
| `useAcceptOrgInviteMutation` | `POST` | `organizations/invite/accept` | `OrgInviteAcceptRequestDto` | `void` | — | — |
| `useChangeOrgMemberRoleMutation` | `PATCH` | `organizations/:id/members/:userId` | `{ id, userId, body: OrgMemberRoleChangeRequestDto }` | `void` | — | `{ OrgMembers, id }` |
| `useRemoveOrgMemberMutation` | `DELETE` | `organizations/:id/members/:userId` | `{ id, userId }` | `void` | — | `{ OrgMembers, id }` |
| `useGetOrgSubscriptionQuery` | `GET` | `organizations/:id/subscription` | `string` (id) | `OrgSubscriptionDetailDto` | `{ OrgSubscription, id }` | — |
| `useUpdateOrgStorageConfigMutation` | `PATCH` | `organizations/:id/subscription/storage` | `{ id, body: UpdateStorageConfigRequestDto }` | `void` | — | `{ OrgSubscription, id }` |

---

## Workspaces API

**File:** `src/app/api/workspaces.ts` · **Server module:** `workspaces`

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useCreateWorkspaceMutation` | `POST` | `workspaces` | `WorkspaceCreateRequestDto` | `WorkspaceResponseDto` | — | `Workspaces` |
| `useMyWorkspacesQuery` | `GET` | `workspaces?orgId=` | `{ orgId?: string }` | `WorkspaceResponseDto[]` | `Workspaces` | — |
| `useWorkspaceQuery` | `GET` | `workspaces/:id` | `string` (id) | `WorkspaceResponseDto` | `{ Workspace, id }` | — |
| `useUpdateWorkspaceMutation` | `PATCH` | `workspaces/:id` | `{ id, body: WorkspaceUpdateRequestDto }` | `WorkspaceResponseDto` | — | `Workspaces` |
| `useDeleteWorkspaceMutation` | `DELETE` | `workspaces/:id` | `string` (id) | `void` | — | `Workspaces` |
| `useAddWorkspaceMemberMutation` | `POST` | `workspaces/:id/members` | `{ id, body: WorkspaceMemberAddRequestDto }` | `void` | — | `{ Workspace, id }` |
| `useRemoveWorkspaceMemberMutation` | `DELETE` | `workspaces/:id/members/:userId` | `{ id, userId }` | `void` | — | `{ Workspace, id }` |

---

## Embed API

**File:** `src/app/api/embed.ts` · **Server module:** `embed`

The `embedViewer` query is the only public-facing endpoint — it authenticates via the `X-Api-Key` header (carrying an embed project's API key) instead of the session cookie. All `embed/projects/*` endpoints are session-authenticated and org-scoped.

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useEmbedViewerQuery` | `GET` | `embed/:modelId` | `{ modelId, apiKey }` (sent as `X-Api-Key` header) | `EmbedViewerResponseDto` | — | — |
| `useEmbedProjectsQuery` | `GET` | `embed/projects?orgId=` | `string` (orgId) | `EmbedProjectResponseDto[]` | `{ EmbedProjects, id: orgId }` | — |
| `useCreateEmbedProjectMutation` | `POST` | `embed/projects` | `EmbedProjectCreateRequestDto` | `EmbedProjectResponseDto` | — | `{ EmbedProjects, id: orgId }` |
| `useUpdateEmbedProjectMutation` | `PATCH` | `embed/projects/:id` | `{ id, body: EmbedProjectUpdateRequestDto }` | `EmbedProjectResponseDto` | — | `{ EmbedProject, id }` |
| `useAddEmbedDomainMutation` | `POST` | `embed/projects/:id/domains` | `{ id, domain: string }` | `EmbedProjectResponseDto` | — | `{ EmbedProject, id }` |
| `useRemoveEmbedDomainMutation` | `DELETE` | `embed/projects/:id/domains/:domain` | `{ id, domain }` | `void` | — | `{ EmbedProject, id }` |
| `useEmbedAnalyticsQuery` | `GET` | `embed/projects/:id/analytics` | `string` (id) | `ViewAnalyticsResponseDto` | `{ EmbedProject, id }` | — |
| `useUploadEmbedLogoMutation` | `POST` | `embed/projects/:id/logo` | `{ id, file: File }` (multipart) | `EmbedProjectResponseDto` | — | `{ EmbedProject, id }` |

---

## Reviews API (Model Comments + Annotations)

**File:** `src/app/api/reviews.ts` · **Server module:** `reviews`

### Comments

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useModelCommentsQuery` | `GET` | `models-3d/:modelId/comments` | `{ modelId }` | `CommentResponseDto[]` | `{ Comments, id: modelId }` | — |
| `useAddCommentMutation` | `POST` | `models-3d/:modelId/comments` | `{ modelId, body: CommentCreateRequestDto }` | `CommentResponseDto` | — | `{ Comments, id: modelId }` |
| `useUpdateCommentMutation` | `PATCH` | `models-3d/:modelId/comments/:commentId` | `{ modelId, commentId, body: CommentUpdateRequestDto }` | `CommentResponseDto` | — | `{ Comments, id: modelId }` |
| `useDeleteCommentMutation` | `DELETE` | `models-3d/:modelId/comments/:commentId` | `{ modelId, commentId }` | `void` | — | `{ Comments, id: modelId }` |

### Annotations

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useModelAnnotationsQuery` | `GET` | `models-3d/:modelId/annotations` | `{ modelId }` | `AnnotationResponseDto[]` | `{ Annotations, id: modelId }` | — |
| `useCreateAnnotationMutation` | `POST` | `models-3d/:modelId/annotations` | `{ modelId, body: AnnotationCreateRequestDto }` | `AnnotationResponseDto` | — | `{ Annotations, id: modelId }` |
| `useUpdateAnnotationMutation` | `PATCH` | `models-3d/:modelId/annotations/:id` | `{ modelId, id, body: AnnotationUpdateRequestDto }` | `AnnotationResponseDto` | — | `{ Annotations, id: modelId }` |
| `useDeleteAnnotationMutation` | `DELETE` | `models-3d/:modelId/annotations/:id` | `{ modelId, id }` | `void` | — | `{ Annotations, id: modelId }` |
| `useReorderAnnotationsMutation` | `PUT` | `models-3d/:modelId/annotations/reorder` | `{ modelId, body: AnnotationReorderRequestDto }` | `void` | — | `{ Annotations, id: modelId }` |

---

## Model Versions API

**File:** `src/app/api/versions.ts` · **Server module:** `versions`

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useModelVersionsQuery` | `GET` | `models-3d/:modelId/versions` | `{ modelId }` | `ModelVersionResponseDto[]` | `{ ModelVersions, id: modelId }` | — |
| `useUploadVersionMutation` | `POST` | `models-3d/:modelId/versions` | `{ modelId, formData: FormData }` | `ModelVersionResponseDto` | — | `{ ModelVersions, id: modelId }` |
| `useActivateVersionMutation` | `POST` | `models-3d/:modelId/versions/:versionId/activate` | `{ modelId, versionId }` | `ModelVersionResponseDto` | — | `{ ModelVersions, id: modelId }`, `{ Get3DModel, id: modelId }` |
| `useDeleteVersionMutation` | `DELETE` | `models-3d/:modelId/versions/:versionId` | `{ modelId, versionId }` | `void` | — | `{ ModelVersions, id: modelId }` |

---

## Display Config API

**File:** `src/app/api/display-config.ts` · **Server module:** `display-config`

Per-model rendering configuration: HDRI environment, light rig, postprocessing, exposure. See [3d-viewer.md](3d-viewer.md) for how the viewer consumes this.

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useGetDisplayConfigQuery` | `GET` | `models-3d/:modelId/display-config` | `{ modelId }` | `DisplayConfigResponseDto` | `{ DisplayConfig, id: modelId }` | — |
| `useUpdateDisplayConfigMutation` | `PATCH` | `models-3d/:modelId/display-config` | `{ modelId, dto: DisplayConfigUpdateDto }` | `DisplayConfigResponseDto` | — | `{ DisplayConfig, id: modelId }` |
| `useUploadDisplayHdriMutation` | `POST` | `models-3d/:modelId/display-config/hdri` | `{ modelId, formData: FormData }` | `DisplayConfigResponseDto` | — | `{ DisplayConfig, id: modelId }` |
| `useRemoveDisplayHdriMutation` | `DELETE` | `models-3d/:modelId/display-config/hdri` | `{ modelId }` | `DisplayConfigResponseDto` | — | `{ DisplayConfig, id: modelId }` |
| `useAddModelLightMutation` | `POST` | `models-3d/:modelId/display-config/lights` | `{ modelId, dto: ModelLightUpsertDto }` | `ModelLightResponseDto` | — | `{ DisplayConfig, id: modelId }` |
| `useUpdateModelLightMutation` | `PATCH` | `models-3d/:modelId/display-config/lights/:lightId` | `{ modelId, lightId, dto: ModelLightUpdateDto }` | `ModelLightResponseDto` | — | `{ DisplayConfig, id: modelId }` |
| `useRemoveModelLightMutation` | `DELETE` | `models-3d/:modelId/display-config/lights/:lightId` | `{ modelId, lightId }` | `void` | — | `{ DisplayConfig, id: modelId }` |

---

## Materials API

**File:** `src/app/api/materials.ts` · **Server module:** `materials`

Per-mesh PBR overrides (base color, metalness/roughness, textures). `meshName` is URL-encoded.

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useGetMaterialsQuery` | `GET` | `models-3d/:modelId/materials` | `{ modelId }` | `MaterialOverrideResponseDto[]` | `{ Materials, id: modelId }` | — |
| `useUpsertMaterialMutation` | `PUT` | `models-3d/:modelId/materials/:meshName` | `{ modelId, meshName, dto: MaterialOverrideUpsertDto }` | `MaterialOverrideResponseDto` | — | `{ Materials, id: modelId }` |
| `useDeleteMaterialMutation` | `DELETE` | `models-3d/:modelId/materials/:meshName` | `{ modelId, meshName }` | `void` | — | `{ Materials, id: modelId }` |
| `useUploadMaterialTextureMutation` | `POST` | `models-3d/:modelId/materials/:meshName/texture/:type` | `{ modelId, meshName, type, formData: FormData }` | `MaterialOverrideResponseDto` | — | `{ Materials, id: modelId }` |
| `useDeleteMaterialTextureMutation` | `DELETE` | `models-3d/:modelId/materials/:meshName/texture/:type` | `{ modelId, meshName, type }` | `MaterialOverrideResponseDto` | — | `{ Materials, id: modelId }` |

---

## Audio API

**File:** `src/app/api/audio.ts` · **Server module:** `audio`

Per-model audio assets (used by `SceneObjectAudioConfigDto` to attach sounds to scene objects).

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useListModelAudioQuery` | `GET` | `models-3d/:modelId/audio` | `{ modelId }` | `ModelAudioResponseDto[]` | `{ ModelAudio, id: modelId }` | — |
| `useUploadModelAudioMutation` | `POST` | `models-3d/:modelId/audio` | `{ modelId, file: File }` (multipart) | `ModelAudioResponseDto` | — | `{ ModelAudio, id: modelId }` |
| `useDeleteModelAudioMutation` | `DELETE` | `models-3d/:modelId/audio/:audioId` | `{ modelId, audioId }` | `void` | — | `{ ModelAudio, id: modelId }` |

---

## Scenes API

**File:** `src/app/api/scenes.ts` · **Server module:** `scenes`

Scene = workspace-scoped (or personal) composition of model references + lights + camera bookmarks. See [scene-editor.md](scene-editor.md).

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useScenesQuery` | `GET` | `scenes` | `{ workspaceId?, userId?, search? }` | `SceneListItemResponseDto[]` | `{ Scenes, id: workspaceId ?? userId ?? 'personal' }` | — |
| `useSceneQuery` | `GET` | `scenes/:id` | `{ sceneId }` | `SceneResponseDto` | `{ Scene, id: sceneId }` | — |
| `useCreateSceneMutation` | `POST` | `scenes` | `SceneCreateRequestDto` | `SceneResponseDto` | — | `{ Scenes, id: workspaceId ?? 'personal' }` |
| `useUpdateSceneMutation` | `PATCH` | `scenes/:id` | `{ sceneId, body: SceneUpdateRequestDto }` | `SceneResponseDto` | — | `{ Scene, id: sceneId }`, `Scenes` |
| `useDeleteSceneMutation` | `DELETE` | `scenes/:id` | `{ sceneId, workspaceId? }` | `void` | — | `{ Scenes, id: workspaceId ?? 'personal' }` |
| `useAddSceneObjectMutation` | `POST` | `scenes/:id/objects` | `{ sceneId, body: SceneObjectUpsertDto }` | `SceneResponseDto` | — | `{ Scene, id: sceneId }` |
| `useUpdateSceneObjectMutation` | `PATCH` | `scenes/:id/objects/:objectId` | `{ sceneId, objectId, body: Partial<SceneObjectUpsertDto> }` | `SceneResponseDto` | — | `{ Scene, id: sceneId }` |
| `useRemoveSceneObjectMutation` | `DELETE` | `scenes/:id/objects/:objectId` | `{ sceneId, objectId }` | `void` | — | `{ Scene, id: sceneId }` |
| `useAddSceneLightMutation` | `POST` | `scenes/:id/lights` | `{ sceneId, body: SceneLightUpsertDto }` | `SceneResponseDto` | — | `{ Scene, id: sceneId }` |
| `useUpdateSceneLightMutation` | `PATCH` | `scenes/:id/lights/:lightId` | `{ sceneId, lightId, body: Partial<SceneLightUpsertDto> }` | `SceneResponseDto` | — | `{ Scene, id: sceneId }` |
| `useRemoveSceneLightMutation` | `DELETE` | `scenes/:id/lights/:lightId` | `{ sceneId, lightId }` | `void` | — | `{ Scene, id: sceneId }` |
| `useUploadSceneHdriMutation` | `POST` | `scenes/:id/hdri` | `{ sceneId, formData: FormData }` | `void` | — | `{ Scene, id: sceneId }` |
| `useUploadSceneThumbnailMutation` | `POST` | `scenes/:id/thumbnail` | `{ sceneId, thumbnail: string }` (base64) | `SceneResponseDto` | — | `{ Scene, id: sceneId }`, `Scenes` |
| `useCloneSceneMutation` | `POST` | `scenes/:id/clone` | `{ id }` | `SceneListItemResponseDto` | — | `{ Scenes, id: result.workspaceId ?? result.userId ?? 'personal' }` |

---

## Scene Reviews API (Scene Comments + Annotations)

**File:** `src/app/api/scene-reviews.ts` · **Server module:** `scene-reviews`

Same shape as the model-level Reviews API, but scoped per-scene. Used by the scene editor's comment/annotation panels.

### Annotations

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useSceneAnnotationsQuery` | `GET` | `scenes/:sceneId/annotations` | `string` (sceneId) | `SceneAnnotationResponseDto[]` | `{ SceneAnnotations, id: sceneId }` | — |
| `useCreateSceneAnnotationMutation` | `POST` | `scenes/:sceneId/annotations` | `{ sceneId, body: SceneAnnotationCreateRequestDto }` | `SceneAnnotationResponseDto` | — | `{ SceneAnnotations, id: sceneId }` |
| `useUpdateSceneAnnotationMutation` | `PATCH` | `scenes/:sceneId/annotations/:annotationId` | `{ sceneId, annotationId, body: SceneAnnotationUpdateRequestDto }` | `SceneAnnotationResponseDto` | — | `{ SceneAnnotations, id: sceneId }` |
| `useDeleteSceneAnnotationMutation` | `DELETE` | `scenes/:sceneId/annotations/:annotationId` | `{ sceneId, annotationId }` | `void` | — | `{ SceneAnnotations, id: sceneId }` |
| `useReorderSceneAnnotationsMutation` | `PUT` | `scenes/:sceneId/annotations/order` | `{ sceneId, body: SceneAnnotationReorderRequestDto }` | `void` | — | `{ SceneAnnotations, id: sceneId }` |

### Comments

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useSceneCommentsQuery` | `GET` | `scenes/:sceneId/comments` | `string` (sceneId) | `SceneCommentResponseDto[]` | `{ SceneComments, id: sceneId }` | — |
| `useAddSceneCommentMutation` | `POST` | `scenes/:sceneId/comments` | `{ sceneId, body: SceneCommentCreateRequestDto }` | `SceneCommentResponseDto` | — | `{ SceneComments, id: sceneId }` |
| `useUpdateSceneCommentMutation` | `PATCH` | `scenes/:sceneId/comments/:commentId` | `{ sceneId, commentId, body: SceneCommentUpdateRequestDto }` | `SceneCommentResponseDto` | — | `{ SceneComments, id: sceneId }` |
| `useDeleteSceneCommentMutation` | `DELETE` | `scenes/:sceneId/comments/:commentId` | `{ sceneId, commentId }` | `void` | — | `{ SceneComments, id: sceneId }` |

---

## Notifications API

**File:** `src/app/api/notifications.ts` · **Server module:** `notifications`

Lightweight in-app notification feed (no pagination — trimmed server-side). See [notifications.md](notifications.md).

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useGetNotificationsQuery` | `GET` | `notifications` | — | `NotificationDto[]` | `{ Notification, id: 'LIST' }` | — |
| `useGetUnreadCountQuery` | `GET` | `notifications/unread-count` | — | `UnreadCountResponseDto` | `{ NotificationCount, id: 'COUNT' }` | — |
| `useMarkNotificationReadMutation` | `PATCH` | `notifications/:id/read` | `{ id }` | `void` | — | `{ Notification, id: 'LIST' }`, `{ NotificationCount, id: 'COUNT' }` |
| `useMarkAllNotificationsReadMutation` | `PATCH` | `notifications/read-all` | — | `void` | — | `{ Notification, id: 'LIST' }`, `{ NotificationCount, id: 'COUNT' }` |

---

## Webhooks API

**File:** `src/app/api/webhooks.ts` · **Server module:** `webhooks`

Per-organization outbound webhooks. The `createWebhook` response includes the signing secret once — only on creation; not returned by `getWebhooks`.

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useGetWebhooksQuery` | `GET` | `organizations/:orgId/webhooks` | `string` (orgId) | `WebhookResponseDto[]` | `{ Webhook, id: 'LIST-${orgId}' }` | — |
| `useCreateWebhookMutation` | `POST` | `organizations/:orgId/webhooks` | `{ orgId, dto: WebhookCreateRequestDto }` | `WebhookCreateResponseDto` (includes `secret`) | — | `{ Webhook, id: 'LIST-${orgId}' }` |
| `useRevokeWebhookMutation` | `DELETE` | `organizations/:orgId/webhooks/:webhookId` | `{ orgId, webhookId }` | `void` | — | `{ Webhook, id: 'LIST-${orgId}' }` |
| `useGetWebhookDeliveriesQuery` | `GET` | `organizations/:orgId/webhooks/:webhookId/deliveries` | `{ orgId, webhookId }` | `WebhookDeliveryLogDto[]` | `{ WebhookDeliveries, id: webhookId }` | — |

---

## API Keys API

**File:** `src/app/api/api-keys.ts` · **Server module:** `api-keys`

Per-organization personal access keys (used e.g. as the `X-Api-Key` header for `embed/:modelId`). The plaintext key is returned on creation only.

| Hook | Method | URL | Request | Response | Provides | Invalidates |
|---|---|---|---|---|---|---|
| `useGetApiKeysQuery` | `GET` | `api-keys?orgId=` | `string` (orgId) | `ApiKeyResponseDto[]` | `{ ApiKey, id: 'LIST-${orgId}' }` | — |
| `useCreateApiKeyMutation` | `POST` | `api-keys` | `{ orgId, dto: ApiKeyCreateRequestDto }` | `ApiKeyResponseDto` (includes plaintext `key`) | — | `{ ApiKey, id: 'LIST-${orgId}' }` |
| `useRevokeApiKeyMutation` | `DELETE` | `api-keys/:keyId?orgId=` | `{ orgId, keyId }` | `void` | — | `{ ApiKey, id: 'LIST-${orgId}' }` |

---

## Common Invalidation Flows

| Action | Triggered Refetch |
|---|---|
| Login / Register / Logout | `currentUser`, all `model3D`, `models3D` |
| Update profile | `currentUser`, `cgSoft` |
| Update / replace 3D model | per-id model, `models3D`, all `Reset`-bound queries |
| Activate model version | per-id model + version list |
| Edit display config / lights / HDRI | per-model display config |
| Edit material override / texture | per-model material list |
| Add / remove scene object or light | per-scene record |
| Update scene metadata or thumbnail | per-scene record + scene list |
| Clone scene | scene list (target workspace/user) |
| Add / update / delete annotation or comment (model or scene) | matching `Annotations` / `Comments` / `SceneAnnotations` / `SceneComments` |
| Mark notification(s) read | notification list + unread badge |
| Create / revoke webhook | per-org webhook list |
| Create / revoke API key | per-org API key list |
| Invite / remove / re-role org member | per-org members |
| Add / remove workspace member | per-workspace record |

---

## Data Transfer Objects (DTOs)

**File:** `src/app/api/dto.ts` (~860 lines, hand-maintained against the server's `swagger.openapi3.json`).

DTOs are split by domain. Selected anchors below; all type names are exported from `dto.ts`.

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

### Auth & User

`SignupRequestDto`, `LoginRequestDto`, `SessionResponseDto`, `UserCurrentResponseDto`, `UserMetaResponseDto`, `UserCurrentUpdateRequestDto`, `UserResetPasswordRequestDto`, `UserNewPasswordRequestDto`, `UserChangePasswordRequestDto`.

### 3D Models, Reviews, Versions

`Model3DResponseDto`, `Model3DUpdateRequestDto`, `Model3DFileResponseDto`, `CategoryRequest`, `CategoryResponse`, `CgSoftRequest`, `CgSoftResponse`, `CommentResponseDto`, `CommentCreateRequestDto`, `CommentUpdateRequestDto`, `AnnotationResponseDto`, `AnnotationCreateRequestDto`, `AnnotationUpdateRequestDto`, `AnnotationReorderRequestDto`, `ModelVersionResponseDto`, `ModelVersionUploaderDto`.

### Display Config / Materials / Audio

`DisplayConfigResponseDto`, `DisplayConfigUpdateDto`, `ModelLightResponseDto`, `ModelLightUpsertDto`, `ModelLightUpdateDto`, `ModelLightType`, `MaterialOverrideResponseDto`, `MaterialOverrideUpsertDto`, `ModelAudioResponseDto`.

### Organizations / Workspaces

`OrganizationResponseDto`, `OrganizationCreateRequestDto`, `OrganizationUpdateRequestDto`, `OrgMemberResponseDto`, `OrgMemberRole`, `OrgInviteCreateRequestDto`, `OrgInviteAcceptRequestDto`, `OrgMemberRoleChangeRequestDto`, `OrgSubscriptionSummaryDto`, `OrgSubscriptionDetailDto`, `S3StorageConfigDto`, `UpdateStorageConfigRequestDto`, `PlanType`, `StorageBackend`, `WorkspaceResponseDto`, `WorkspaceCreateRequestDto`, `WorkspaceUpdateRequestDto`, `WorkspaceMemberAddRequestDto`, `WorkspaceMemberRole`.

### Embed

`EmbedProjectResponseDto`, `EmbedProjectCreateRequestDto`, `EmbedProjectUpdateRequestDto`, `EmbedViewerResponseDto`, `BrandingConfigDto`, `ViewAnalyticsResponseDto`, `DailyViewDto`, `OriginViewDto`.

### Scenes & Scene Reviews

`SceneResponseDto`, `SceneListItemResponseDto`, `SceneCreateRequestDto`, `SceneUpdateRequestDto`, `SceneObjectResponseDto`, `SceneObjectUpsertDto`, `SceneObjectModelDto`, `SceneObjectModelFileDto`, `SceneObjectAudioConfigDto`, `SceneLightResponseDto`, `SceneLightUpsertDto`, `SceneLightType`, `SceneCameraBookmarkDto`, `SceneConfigDto`, `SceneVisibility`, `SceneAnnotationResponseDto`, `SceneAnnotationCreateRequestDto`, `SceneAnnotationUpdateRequestDto`, `SceneAnnotationReorderRequestDto`, `SceneCommentResponseDto`, `SceneCommentCreateRequestDto`, `SceneCommentUpdateRequestDto`.

### Notifications / Webhooks / API Keys

`NotificationDto`, `UnreadCountResponseDto`, `WebhookCreateRequestDto`, `WebhookResponseDto`, `WebhookCreateResponseDto`, `WebhookDeliveryLogDto`, `WebhookEvent`, `WEBHOOK_EVENTS`, `ApiKeyCreateRequestDto`, `ApiKeyResponseDto`, `ApiKeyScope`, `API_KEY_SCOPES`.

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
- Only one refresh attempt runs at a time across all in-flight requests.
- If a second request arrives during an ongoing refresh, it waits then retries with the new session cookie.
- On refresh failure the `user.session` slice is set to `null`, which allows the UI to show an unauthenticated state.
- Do not add a second refresh path — the mutex assumes a single locker.

---

## Related Docs

- [3d-viewer.md](3d-viewer.md) — viewer pipeline, how it consumes display config + materials
- [scene-editor.md](scene-editor.md) — scene editor flows (objects, lights, comments, annotations)
- [embed.md](embed.md) — embed project lifecycle, public viewer, analytics
- [organization-dashboard.md](organization-dashboard.md) — org/workspace/members UI flows
- [notifications.md](notifications.md) — notification feed widget + invalidation strategy
- [editor.md](editor.md) — model editor (display config + materials UI)
- [widgets.md](widgets.md) — FSD widget catalogue
- [architecture.md](architecture.md) — top-level FSD layout
- [routing.md](routing.md) — route → page mapping
- [state-management.md](state-management.md) — Redux slices alongside RTK Query
- [../../server/docs/api.md](../../server/docs/api.md) — backend API conventions and module index
