# API Reference

All endpoints are prefixed with `/api` (configured via `APP_GLOBAL_PREFIX`).

## Authentication

- **Default**: all endpoints require a valid JWT access token delivered via HttpOnly cookie (`AUTH_JWT_COOKIE_NAME`).
- `[Public]` — no authentication required.
- `[Refresh]` — requires the refresh token cookie instead of the access token.
- `[Admin]` — requires the `admin` role.
- `[SuperUser]` — requires the `super-user` role.

---

## Auth — `/auth`

### POST `/auth/signup` `[Public]`

Register a new user account.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "confirmPassword": "Str0ng!Pass",
  "firstName": "Ivan",
  "middleName": "Ivanovich",
  "lastName": "Ivanov"
}
```

**Response** — `201 Created`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Ivan",
  "lastName": "Ivanov",
  ...
}
```

Sets JWT access and refresh cookies.

---

### POST `/auth/login` `[Public]`

Authenticate an existing user.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}
```

**Response** — `200 OK` (user object)

Sets JWT access and refresh cookies. If a session already exists for the same IP + user agent, it is replaced.

---

### POST `/auth/refresh` `[Refresh]`

Exchange a valid refresh token for new access and refresh tokens.

**Request** — no body. Reads refresh token from cookie.

**Response** — `200 OK` (current user object)

Replaces the existing session's tokens. Sets new cookies.

---

### POST `/auth/logout`

Invalidate the current session.

**Request** — no body.

**Response** — `200 OK`

Clears cookies and deletes the session from the DB.

---

### GET `/auth/current-user-sessions`

List all active sessions for the authenticated user (paginated).

**Query params**
| Param | Type | Default | Description |
|---|---|---|---|
| `skip` | number | 0 | Records to skip |
| `size` | number | 20 | Page size |
| `sort` | string[] | — | Sort fields, prefix `+` ASC or `-` DESC (e.g., `+createdAt`) |

**Response** — `200 OK`
```json
{
  "data": [{ "id": "uuid", "ip": "...", "userAgent": "...", "createdAt": "...", "expiredAt": "..." }],
  "skip": 0,
  "size": 20,
  "totalCount": 3,
  "hasMore": false
}
```

---

### DELETE `/auth/current-user-sessions/:id`

Delete a specific session by ID.

**Response** — `200 OK`

---

### DELETE `/auth/current-user-sessions`

Delete all sessions for the authenticated user (logs out everywhere).

**Response** — `200 OK`

---

## User — `/user`

### GET `/user/current`

Get the authenticated user's profile.

**Response** — `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "+79991234567",
  "firstName": "Ivan",
  "middleName": "Ivanovich",
  "lastName": "Ivanov",
  "isConfirmed": false,
  "isActive": true,
  "lastLoginDate": "2026-04-22T10:00:00Z",
  "createdAt": "2026-01-01T00:00:00Z",
  "roles": [{ "id": 1, "name": "user" }],
  "userMeta": {
    "avatar": "abc123.jpg",
    "aboutYourself": "...",
    "favoriteSoft": [{ "id": 1, "name": "Blender" }]
  }
}
```

---

### PATCH `/user/current`

Update the authenticated user's profile.

**Request body** (all fields optional)
```json
{
  "firstName": "Ivan",
  "middleName": "Ivanovich",
  "lastName": "Ivanov",
  "phone": "+79991234567",
  "aboutYourself": "3D artist",
  "favoriteSoft": [
    { "id": 1 },
    { "id": "new", "name": "My Software" }
  ]
}
```

`favoriteSoft` items with `id: "new"` will be created as new `CgSoftEntity` records.

**Response** — `200 OK` (updated user object)

---

### POST `/user/current/avatar`

Upload a new avatar image. `multipart/form-data`.

**Form field**: `avatar` — image file (PNG, JPEG, GIF, SVG, WebP, AVIF; max 1 MB)

**Response** — `201 Created` (updated user object)

Previous avatar file is deleted from storage.

---

### GET `/user/avatar/:fileName` `[Public]`

Download a user avatar image. Response is cached (`Cache-Control: max-age=...`).

**Response** — `200 OK` (binary image)

---

### POST `/user/change-password`

Change the authenticated user's password.

**Request body**
```json
{
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!",
  "confirmNewPassword": "NewPass1!"
}
```

**Response** — `200 OK`

---

### POST `/user/reset-password` `[Public]`

Request a password reset email.

**Request body**
```json
{
  "email": "user@example.com"
}
```

**Response** — `200 OK`

Sends an email with a reset link (expires in `RESET_PASSWORD_EXPIRE_SECONDS`).

---

### POST `/user/new-password` `[Public]`

Set a new password using a reset token.

**Request body**
```json
{
  "resetId": "uuid",
  "newPassword": "NewPass1!",
  "confirmNewPassword": "NewPass1!"
}
```

**Response** — `200 OK`

---

## Notifications — `/notifications`

In-app notification feed for the current user. All routes require an authenticated user.

### GET `/notifications`

List the most recent notifications for the current user.

**Response** — `200 OK` (`NotificationResponseDto[]`)

DTO: `src/modules/notifications/dto/notification.response.dto.ts`.

---

### GET `/notifications/unread-count`

Get the count of unread notifications for the current user.

**Response** — `200 OK` (`UnreadCountResponseDto`)
```json
{ "count": 3 }
```

---

### PATCH `/notifications/read-all`

Mark every notification for the current user as read. Returns `204 No Content`.

---

### PATCH `/notifications/:id/read`

Mark a specific notification as read. Returns `204 No Content`.

---

## 3D Models — `/models-3d`

### GET `/models-3d` `[Public]`

Get all publicly visible 3D models (paginated, filterable).

**Query params**
| Param | Type | Description |
|---|---|---|
| `skip` | number | Records to skip |
| `size` | number | Page size |
| `sort` | string[] | Sort fields (`+name`, `-createdAt`, etc.) |
| `search` | string | Filter by name (case-insensitive, partial match) |
| `categories` | number[] | Filter by category IDs |

**Response** — `200 OK`
```json
{
  "data": [ { ...Model3dResponse } ],
  "skip": 0,
  "size": 20,
  "totalCount": 100,
  "hasMore": true
}
```

---

### GET `/models-3d/current-user`

Get the authenticated user's 3D models (paginated).

**Query params** — same as `GET /models-3d` (without `categories` filter restriction)

**Response** — `200 OK` (paginated list, includes non-visible models)

---

### GET `/models-3d/:modelId` `[Public]`

Get a single 3D model by ID.

**Response** — `200 OK`
```json
{
  "id": "uuid",
  "name": "My Robot",
  "description": { ... },
  "thumbnail": "thumbnail.png",
  "isVisible": true,
  "isOwner": false,
  "createdAt": "2026-01-01T00:00:00Z",
  "file": {
    "id": "uuid",
    "name": "robot.glb",
    "size": 10485760,
    "extension": ".glb"
  },
  "user": { "id": "uuid", "firstName": "Ivan", ... },
  "categories": [ { "id": 1, "name": "Characters" } ]
}
```

`isOwner` is `true` when the requesting user is the model owner.

---

### PATCH `/models-3d/:modelId`

Update a 3D model's metadata.

**Request body** (all fields optional)
```json
{
  "name": "Updated Name",
  "isVisible": false,
  "description": { ... },
  "categories": [1, 2, 3]
}
```

**Response** — `200 OK` (updated model object)

Only the model owner can update it.

---

### DELETE `/models-3d/:modelId`

Delete a 3D model and all associated files.

**Response** — `200 OK`

Only the model owner can delete it.

---

### POST `/models-3d/upload`

Upload a 3D model file and create the associated `Model3dEntity`. `multipart/form-data`.

**Form fields** (`UploadModel3dRequestDto`):
- `file` — 3D model file (`.glb` or `.gltf`; max 3 GB)
- `workspaceId` — optional uuid; assigns the model to a workspace (and triggers per-org storage strategy / quota)

**Response** — `201 Created` — `{ "modelId": "uuid" }`

---

### POST `/models-3d/:modelId/save-thumbnail-base64`

Save a thumbnail from a base64-encoded PNG produced by the viewer.

**Request body** — `{ "thumbnail": "data:image/png;base64,..." }`

**Response** — `201 Created`

---

### GET `/models-3d/files/:modelId/thumbnail` `[Public]`

Stream the model thumbnail image (`Cache-Control: max-age=31536000`).

**Response** — `200 OK` (binary)

---

### GET `/models-3d/files/:modelId/*splat` `[Public]`

Stream a model asset by relative path within the model directory. May 307-redirect to a signed S3 URL when the model's workspace is on an S3-backed organization.

**Response** — `200 OK` (binary, `Cache-Control: max-age=2592000`) or `307 Temporary Redirect`

---

### GET `/models-3d/files/:modelId/versions/:versionId/*splat` `[Public]`

Stream an asset belonging to a specific version. Same redirect behaviour as the previous route.

**Response** — `200 OK` (binary) or `307 Temporary Redirect`

---

## Resources — `/resources`

### GET `/resources/cg-soft/all` `[Public]`

Get all available 3D software entries.

**Response** — `200 OK`
```json
[
  { "id": 1, "name": "Blender", "description": null },
  { "id": 2, "name": "3ds Max", "description": null }
]
```

---

### GET `/resources/category/all` `[Public]`

Get all available model categories.

**Response** — `200 OK`
```json
[
  { "id": 1, "name": "Animals", "description": null },
  { "id": 2, "name": "Architecture", "description": null }
]
```

---

## Reviews (Comments) — `/models-3d/:modelId/comments`

### GET `/models-3d/:modelId/comments` `[Public]`

Get paginated comments for a model.

**Query params**: `skip`, `size`, `sort`

**Response** — `200 OK` (paginated `ModelCommentResponseDto[]`)
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Great model!",
      "rating": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": { "id": "uuid", "firstName": "Ivan", "lastName": "Ivanov", "userMeta": { "avatar": "abc.jpg" } }
    }
  ],
  "skip": 0,
  "size": 20,
  "totalCount": 1,
  "hasMore": false
}
```

---

### POST `/models-3d/:modelId/comments`

Create a new comment on a model.

**Request body**
```json
{ "text": "Great model!", "rating": 5 }
```

**Response** — `201 Created` (created `ModelCommentResponseDto`)

---

### PATCH `/models-3d/:modelId/comments/:commentId`

Update own comment. Returns `200 OK`.

---

### DELETE `/models-3d/:modelId/comments/:commentId`

Delete own comment. Returns `204 No Content`.

---

## Annotations — `/models-3d/:modelId/annotations`

### GET `/models-3d/:modelId/annotations` `[Public]`

Get all annotations for a model.

**Response** — `200 OK` (`ModelAnnotationResponseDto[]`)
```json
[
  {
    "id": "uuid",
    "label": "Wheel",
    "text": "This is the front wheel",
    "position": { "x": 1.2, "y": 0.5, "z": -0.3 },
    "order": 0
  }
]
```

---

### POST `/models-3d/:modelId/annotations`

Create a new annotation.

**Request body**
```json
{ "label": "Wheel", "text": "...", "position": { "x": 1.2, "y": 0.5, "z": -0.3 } }
```

**Response** — `201 Created`

---

### PATCH `/models-3d/:modelId/annotations/:id`

Update an annotation. Returns `200 OK`.

---

### DELETE `/models-3d/:modelId/annotations/:id`

Delete an annotation. Returns `204 No Content`.

---

### PUT `/models-3d/:modelId/annotations/reorder`

Reorder annotations.

**Request body**
```json
{ "ids": ["uuid1", "uuid2", "uuid3"] }
```

**Response** — `200 OK`

---

## Model Versions — `/models-3d/:modelId/versions`

### GET `/models-3d/:modelId/versions`

Get all versions for a model.

**Response** — `200 OK` (`ModelVersionResponseDto[]`)
```json
[
  {
    "id": "uuid",
    "versionNumber": 2,
    "isActive": true,
    "filename": "car_v2.glb",
    "size": 1048576,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST `/models-3d/:modelId/versions`

Upload a new model file version. `multipart/form-data`. Body fields use `VersionUploadRequestDto` (optional `changeNotes`).

**Form field**: `file` — `.glb` or `.gltf` file (max 3 GB)

**Response** — `201 Created` (`VersionResponseDto`)

---

### POST `/models-3d/:modelId/versions/:versionId/activate`

Set a specific version as the active (displayed) version.

**Response** — `200 OK` (`VersionResponseDto`)

---

### DELETE `/models-3d/:modelId/versions/:versionId`

Delete a model version. Returns `200 OK`.

---

## Model Audio — `/models-3d/:modelId/audio`

Per-model audio attachments (background music or narration in the viewer).

### GET `/models-3d/:modelId/audio`

List audio tracks attached to a model.

**Response** — `200 OK` (`ModelAudioResponseDto[]`)

DTO: `src/modules/models-3d/audio/dto/model-audio.response.dto.ts`.

---

### POST `/models-3d/:modelId/audio`

Upload a new audio track. `multipart/form-data`.

**Form field**: `file` — audio file (`audio/mpeg`, `audio/mp3`, `audio/ogg`, `audio/wav`; max 20 MB)

**Response** — `200 OK` (`ModelAudioResponseDto`)

---

### DELETE `/models-3d/:modelId/audio/:audioId`

Remove an audio track. Returns `204 No Content`.

---

### GET `/models-3d/:modelId/audio/:audioId/stream` `[Public]`

Stream the audio file. May 302-redirect to a signed S3 URL when the model is stored on an S3-backed org.

**Response** — `200 OK` (binary, `Content-Type: audio/mpeg`) or `302 Found`

---

## Model Materials — `/models-3d/:modelId/materials`

Per-mesh material overrides (PBR factors + textures) layered on top of the original GLTF materials.

### GET `/models-3d/:modelId/materials` `[Public]`

List all material overrides for the model.

**Response** — `200 OK` (`MaterialOverrideResponseDto[]`)

DTO: `src/modules/models-3d/materials/dto/material-override.response.dto.ts`.

---

### PUT `/models-3d/:modelId/materials/:meshName`

Create or update an override for the named mesh. `:meshName` is URL-encoded.

**Body** — `MaterialOverrideUpsertDto` (PBR factors, optional metadata).

**Response** — `200 OK` (`MaterialOverrideResponseDto`)

---

### DELETE `/models-3d/:modelId/materials/:meshName`

Drop the override (and any uploaded textures) for the mesh. Returns `204 No Content`.

---

### POST `/models-3d/:modelId/materials/:meshName/texture/:type`

Upload a texture map for the override. `multipart/form-data`. `:type` is one of the texture slots (`baseColor`, `normal`, `roughness`, `metallic`, `emissive`, …) — see `MaterialsService` for the accepted set.

**Form field**: `file` — image (`image/png`, `image/jpeg`, `image/webp`; max 5 MB)

**Response** — `200 OK` (`MaterialOverrideResponseDto`)

---

### DELETE `/models-3d/:modelId/materials/:meshName/texture/:type`

Clear the named texture slot. Returns `200 OK` (`MaterialOverrideResponseDto`).

---

### GET `/models-3d/:modelId/materials/:meshName/texture/:type` `[Public]`

Serve the override texture binary.

**Response** — `200 OK` (binary)

---

## Model Display Config — `/models-3d/:modelId/display-config`

Per-model viewer presentation config (lights, environment, post-processing, camera defaults). Stored in `model_3d.display_config`.

### GET `/models-3d/:modelId/display-config` `[Public]`

Get (or lazily create) the model's display config.

**Response** — `200 OK` (`DisplayConfigResponseDto`)

DTO: `src/modules/models-3d/display-config/dto/display-config.response.dto.ts`.

---

### PATCH `/models-3d/:modelId/display-config`

Update the display config.

**Body** — `DisplayConfigUpdateDto` (env, post-processing, camera, render settings).

**Response** — `200 OK` (`DisplayConfigResponseDto`)

---

### POST `/models-3d/:modelId/display-config/hdri`

Upload an HDRI environment map for the model. `multipart/form-data`.

**Form field**: `file` — `.hdr` / `.exr` (max 20 MB)

**Response** — `200 OK` (`DisplayConfigResponseDto`)

---

### DELETE `/models-3d/:modelId/display-config/hdri`

Remove the model HDRI. Returns `200 OK` (`DisplayConfigResponseDto`).

---

### POST `/models-3d/:modelId/display-config/lights`

Add a light to the model's display config.

**Body** — `ModelLightUpsertDto`.

**Response** — `201 Created` (`DisplayConfigResponseDto`)

---

### PATCH `/models-3d/:modelId/display-config/lights/:lightId`

Update a model light.

**Body** — `ModelLightUpdateDto`.

**Response** — `200 OK` (`DisplayConfigResponseDto`)

---

### DELETE `/models-3d/:modelId/display-config/lights/:lightId`

Remove a model light. Returns `204 No Content`.

---

## Organizations — `/organizations`

### POST `/organizations`

Create a new organization.

**Request body**
```json
{ "name": "My Studio", "slug": "my-studio" }
```

**Response** — `201 Created` (`OrgResponseDto`)

---

### GET `/organizations/current`

Get all organizations the current user is a member of.

**Response** — `200 OK` (`OrgResponseDto[]`)

---

### POST `/organizations/invite/accept` `[Public]`

Accept an organization invite via token.

**Request body**
```json
{ "token": "invite-token" }
```

**Response** — `200 OK`

---

### GET `/organizations/:id`

Get organization details.

**Response** — `200 OK` (`OrgResponseDto`)

---

### PATCH `/organizations/:id`

Update organization. Returns `200 OK`.

---

### GET `/organizations/:id/members`

Get organization members list.

**Response** — `200 OK` (`OrgMemberResponseDto[]`)

---

### POST `/organizations/:id/invite`

Invite a user to the organization by email.

**Request body**
```json
{ "email": "user@example.com", "role": "viewer" }
```

**Response** — `201 Created`

---

### PATCH `/organizations/:id/members/:userId`

Change a member's role.

**Request body**
```json
{ "role": "admin" }
```

**Response** — `200 OK`

---

### DELETE `/organizations/:id/members/:userId`

Remove a member from the organization. Returns `204 No Content`.

---

### GET `/organizations/:id/subscription`

Get the organization's current subscription and storage config.

**Response** — `200 OK` (`OrgSubscriptionResponseDto`)
```json
{
  "id": "uuid",
  "plan": "growth",
  "storageLimit": 107374182400,
  "storageUsed": 1073741824,
  "s3Enabled": false
}
```

---

### PATCH `/organizations/:id/subscription/storage`

Update the organization's storage configuration (`StorageBackend` + optional encrypted S3 config). Body: `UpdateStorageConfigRequestDto`. Requires the `Owner` org role. Returns `204 No Content`.

---

## Webhooks — `/organizations/:id/webhooks`

Outbound webhooks per organization. All routes require the caller to be an `Admin` of the organization.

### POST `/organizations/:id/webhooks`

Register a new webhook.

**Body** — `WebhookCreateRequestDto` (`url`, event filters, optional secret hint).

**Response** — `201 Created` (`WebhookCreateResponseDto`) — includes the generated signing secret. Stored hashed; shown only on creation.

---

### GET `/organizations/:id/webhooks`

List webhooks for the org.

**Response** — `200 OK` (`WebhookResponseDto[]`)

---

### DELETE `/organizations/:id/webhooks/:webhookId`

Revoke a webhook (soft delete). Returns `204 No Content`.

---

### GET `/organizations/:id/webhooks/:webhookId/deliveries`

Most recent delivery attempts (limit 20) for the webhook, ordered newest-first.

**Response** — `200 OK` (`WebhookDeliveryLogResponseDto[]`)

DTO: `src/modules/organizations/webhooks/dto/webhook-delivery-log.response.dto.ts`.

---

## Workspaces — `/workspaces`

### POST `/workspaces`

Create a new workspace within an organization.

**Request body**
```json
{ "name": "Production", "orgId": "org-uuid" }
```

**Response** — `201 Created` (`WorkspaceResponseDto`)

---

### GET `/workspaces`

Get workspaces. Filter by `orgId` query param.

**Response** — `200 OK` (`WorkspaceResponseDto[]`)

---

### GET `/workspaces/:id`

Get workspace details. Returns `200 OK`.

---

### PATCH `/workspaces/:id`

Update workspace. Returns `200 OK`.

---

### DELETE `/workspaces/:id`

Delete workspace. Returns `204 No Content`.

---

### POST `/workspaces/:id/members`

Add a member to the workspace.

**Request body**
```json
{ "userId": "uuid" }
```

**Response** — `201 Created`

---

### DELETE `/workspaces/:id/members/:userId`

Remove a member from the workspace. Returns `204 No Content`.

---

## API Keys — `/api-keys`

### POST `/api-keys`

Generate a new API key scoped to an organization.

**Request body**
```json
{ "name": "Embed Key 1", "orgId": "org-uuid" }
```

**Response** — `201 Created` (`ApiKeyResponseDto`)
```json
{
  "id": "uuid",
  "name": "Embed Key 1",
  "prefix": "mh_live_",
  "scopes": ["embed:read"],
  "lastUsedAt": null,
  "expiresAt": null,
  "revokedAt": null,
  "rawKey": "mh_live_abc123..."
}
```

> `rawKey` is only returned once on creation. Store it securely; subsequent list responses omit it.

Body shape: see `src/modules/api-keys/dto/api-key.create.request.dto.ts`.

---

### GET `/api-keys`

List API keys for an organization. Required query: `orgId` (uuid).

**Response** — `200 OK` (`ApiKeyResponseDto[]`, without `rawKey`)

---

### DELETE `/api-keys/:id`

Revoke an API key. Required query: `orgId` (uuid). Returns `200 OK`.

---

## Embed — `/embed`

### POST `/embed/projects`

Create a new embed project.

**Request body**
```json
{ "name": "Product Viewer", "modelId": "model-uuid", "orgId": "org-uuid" }
```

**Response** — `201 Created` (`EmbedProjectResponseDto`)

---

### GET `/embed/projects`

List embed projects. Filter by `orgId` query param.

**Response** — `200 OK` (`EmbedProjectResponseDto[]`)

---

### PATCH `/embed/projects/:id`

Update embed project settings. Returns `200 OK`.

---

### POST `/embed/projects/:id/domains`

Add an allowed domain.

**Request body**
```json
{ "domain": "example.com" }
```

**Response** — `201 Created`

---

### DELETE `/embed/projects/:id/domains/:domain`

Remove an allowed domain. Returns `204 No Content`.

---

### GET `/embed/projects/:id/analytics`

Get aggregated view analytics for the embed project.

**Response** — `200 OK` (`ViewAnalyticsResponseDto`)

DTO: `src/modules/embed/dto/view-analytics.response.dto.ts`.

---

### POST `/embed/projects/:id/logo`

Upload an embed project logo. `multipart/form-data`.

**Form field**: `file` — image file

**Response** — `200 OK` (`EmbedProjectResponseDto`)

---

### GET `/embed/projects/:id/logo` `[Public]`

Serve embed project logo file (`Cache-Control: max-age=3600`).

---

### GET `/embed/:targetId` `[Public + ApiKey]`

Get full embed viewer payload (model + embed project config). `:targetId` is the embed project id. Requires a valid API key with the `embed:read` scope (passed via `X-Api-Key` header or `apiKey` query param) and an `Origin` matching one of the project's allowed domains.

**Response** — `200 OK` (`EmbedViewerResponseDto`)

---

## Scenes — `/scenes`

### POST `/scenes`

Create a new scene.

**Request body**
```json
{ "name": "Main Scene", "workspaceId": "workspace-uuid" }
```

**Response** — `201 Created` (`SceneResponseDto`)

---

### GET `/scenes`

List scenes the caller has access to.

**Query params** (all optional):
- `workspaceId` — restrict to one workspace
- `userId` — restrict to scenes owned by that user
- `search` — case-insensitive name match

**Response** — `200 OK` (`SceneListItemResponseDto[]`)
```json
[
  {
    "id": "uuid",
    "name": "Main Scene",
    "objectCount": 3,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/scenes/using-model/:modelId` `[Public]`

List scenes that reference a given model. Visible scenes (and the caller's own) only.

**Response** — `200 OK` (`SceneListItemResponseDto[]`)

---

### POST `/scenes/:id/clone`

Duplicate a scene (new id, copies objects/lights/HDRI reference).

**Response** — `201 Created` (`SceneListItemResponseDto`)

---

### GET `/scenes/:id` `[Public]`

Get full scene with all objects and lights. Visibility is enforced server-side; non-owners get `404` for non-public scenes.

**Response** — `200 OK` (`SceneResponseDto`)
```json
{
  "id": "uuid",
  "name": "Main Scene",
  "hdriPath": "scenes/uuid/hdri.hdr",
  "objects": [
    {
      "id": "uuid",
      "position": { "x": 0, "y": 0, "z": 0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 1, "y": 1, "z": 1 },
      "model": {
        "id": "uuid",
        "name": "My Car",
        "file": { "id": "uuid", "filename": "car.glb", "entryFile": "car.glb" }
      }
    }
  ],
  "lights": [
    {
      "id": "uuid",
      "type": "directional",
      "color": "#ffffff",
      "intensity": 1,
      "position": { "x": 5, "y": 10, "z": 5 }
    }
  ]
}
```

---

### PATCH `/scenes/:id`

Update scene metadata (name, camera bookmark). Returns `200 OK`.

---

### DELETE `/scenes/:id`

Delete a scene. Returns `204 No Content`.

---

### POST `/scenes/:id/objects`

Add a 3D model object to the scene.

**Request body**
```json
{
  "modelId": "model-uuid",
  "position": { "x": 0, "y": 0, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "scale": { "x": 1, "y": 1, "z": 1 }
}
```

**Response** — `201 Created` (`SceneObjectResponseDto`)

---

### PATCH `/scenes/:id/objects/:objId`

Update a scene object's transform. Returns `200 OK`.

---

### DELETE `/scenes/:id/objects/:objId`

Remove an object from the scene. Returns `204 No Content`.

---

### POST `/scenes/:id/lights`

Add a light to the scene.

**Request body**
```json
{
  "type": "directional",
  "color": "#ffffff",
  "intensity": 1,
  "position": { "x": 5, "y": 10, "z": 5 }
}
```

**Response** — `201 Created` (`SceneLightResponseDto`)

---

### PATCH `/scenes/:id/lights/:lightId`

Update a scene light. Returns `200 OK`.

---

### DELETE `/scenes/:id/lights/:lightId`

Remove a light from the scene. Returns `204 No Content`.

---

### POST `/scenes/:id/hdri`

Upload an HDRI environment map. `multipart/form-data`.

**Form field**: `file` — `.hdr` file (max 20 MB)

**Response** — `200 OK` (`SceneResponseDto`)

---

### GET `/scenes/:id/hdri` `[Public]`

Serve the scene HDRI file. May 307-redirect to a signed URL on S3-backed orgs.

---

### POST `/scenes/:id/thumbnail`

Save a scene thumbnail (base64 PNG from the viewer).

**Request body**
```json
{ "thumbnail": "data:image/png;base64,..." }
```

**Response** — `200 OK` (`SceneResponseDto`)

---

## Scene Annotations — `/scenes/:sceneId/annotations`

3D-anchored notes on a scene (separate from per-model annotations under `/models-3d/:modelId/annotations`).

### GET `/scenes/:sceneId/annotations` `[Public]`

List annotations for the scene.

**Response** — `200 OK` (`SceneAnnotationResponseDto[]`)

DTO: `src/modules/scenes/annotations/dto/scene-annotation.response.dto.ts`.

---

### POST `/scenes/:sceneId/annotations`

Create an annotation.

**Body** — `SceneAnnotationCreateRequestDto`.

**Response** — `201 Created` (`SceneAnnotationResponseDto`)

---

### PATCH `/scenes/:sceneId/annotations/:annotId`

Update an annotation.

**Body** — `SceneAnnotationUpdateRequestDto`.

**Response** — `200 OK` (`SceneAnnotationResponseDto`)

---

### DELETE `/scenes/:sceneId/annotations/:annotId`

Delete an annotation. Returns `204 No Content`.

---

### PUT `/scenes/:sceneId/annotations/order`

Reorder annotations.

**Body** — `SceneAnnotationReorderRequestDto` (`{ items: { id, order }[] }`).

**Response** — `204 No Content`

---

## Scene Comments — `/scenes/:sceneId/comments`

Free-text comments on a scene (no rating; distinct from `/models-3d/:modelId/comments`).

### GET `/scenes/:sceneId/comments` `[Public]`

List comments for the scene.

**Response** — `200 OK` (`SceneCommentResponseDto[]`)

DTO: `src/modules/scenes/comments/dto/scene-comment.response.dto.ts`.

---

### POST `/scenes/:sceneId/comments`

Add a comment.

**Body** — `SceneCommentCreateRequestDto`.

**Response** — `201 Created` (`SceneCommentResponseDto`)

---

### PATCH `/scenes/:sceneId/comments/:commentId`

Update own comment.

**Body** — `SceneCommentUpdateRequestDto`.

**Response** — `200 OK` (`SceneCommentResponseDto`)

---

### DELETE `/scenes/:sceneId/comments/:commentId`

Delete own comment. Returns `204 No Content`.

---

## Common Response Shapes

### Validation Error (400)
```json
{
  "error": "Bad Request",
  "type": "ValidationError",
  "status": 400,
  "message": "Ошибка валидации",
  "data": [
    { "property": "email", "errors": ["email must be an email"] }
  ]
}
```

### Application Error (4xx / 5xx)
```json
{
  "error": "Unauthorized",
  "type": "AuthError",
  "status": 401,
  "message": "...",
  "data": null
}
```

### Throttle Error (429)
Standard NestJS throttler response.

---

## Pagination Response Shape

```json
{
  "data": [ ...items ],
  "skip": 0,
  "size": 20,
  "sort": ["+createdAt"],
  "totalCount": 100,
  "hasMore": true
}
```

---

## See also

Per-domain references with deeper coverage of routes, payloads, and side effects:

- [auth.md](auth.md) — sign-up / login / refresh / sessions, JWT cookie contract.
- [organizations.md](organizations.md) — orgs, members, invites, plans, webhooks (`/organizations/:id/webhooks/*`).
- [scenes.md](scenes.md) — scenes, scene objects, lights, scene annotations, scene comments.
- [embed.md](embed.md) — embed projects, allowed domains, analytics, public viewer route, API-key scopes.
- [model-3d.md](model-3d.md) — model upload pipeline, versions, materials, audio, display config, file streaming.
- [notifications.md](notifications.md) — in-app notifications, unread counts, transports.
- [file-storage.md](file-storage.md) — `IFileStorageStrategy` and per-org S3 routing for the binary asset endpoints above.
