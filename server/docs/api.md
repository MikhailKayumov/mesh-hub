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

### POST `/models-3d/:modelId/file`

Upload a 3D model file. `multipart/form-data`.

**Form field**: `file` — 3D model file (`.glb` or `.gltf`; max 3 GB)

**Response** — `201 Created` (updated model object)

Replaces the existing file if one was already uploaded.

---

### POST `/models-3d/:modelId/thumbnail`

Save a thumbnail from a base64-encoded PNG.

**Request body**
```json
{
  "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response** — `201 Created` (updated model object)

---

### GET `/models-3d/:modelId/file` `[Public]`

Download the 3D model file.

**Response** — `200 OK` (binary file stream, with proper `Content-Type` and `Content-Disposition`)

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

Upload a new model file version. `multipart/form-data`.

**Form field**: `model` — `.glb` or `.gltf` file (max 3 GB)

**Response** — `201 Created`

---

### PATCH `/models-3d/:modelId/versions/:versionId/activate`

Set a specific version as the active (displayed) version.

**Response** — `200 OK`

---

### DELETE `/models-3d/:modelId/versions/:versionId`

Delete a model version. Returns `204 No Content`.

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

Update the organization's storage configuration (S3 settings). Returns `200 OK`.

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

**Response** — `201 Created`
```json
{
  "id": "uuid",
  "name": "Embed Key 1",
  "key": "mh_live_abc123...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

> The raw `key` is only returned once on creation. Store it securely.

---

### GET `/api-keys`

List API keys for an organization. Filter by `orgId` query param.

**Response** — `200 OK` (key list without the raw key value)

---

### DELETE `/api-keys/:id`

Revoke an API key. Pass `orgId` as query param. Returns `204 No Content`.

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

Get embed view analytics (paginated `ModelViewLogDto[]`).

---

### POST `/embed/projects/:id/logo`

Upload embed project logo. `multipart/form-data`.

**Form field**: `logo` — image file (max 1 MB)

**Response** — `201 Created`

---

### GET `/embed/projects/:id/logo` `[Public]`

Serve embed project logo file.

---

### GET `/embed/:modelId` `[Public + ApiKeyGuard]`

Get full embed viewer payload (model + embed project config). Requires valid API key in `X-Api-Key` header or `apiKey` query param.

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

List scenes. Filter by `workspaceId` query param.

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

### GET `/scenes/:id`

Get full scene with all objects and lights.

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

**Form field**: `hdri` — `.hdr` file (max 20 MB)

**Response** — `201 Created`

---

### GET `/scenes/:id/hdri` `[Public]`

Serve the scene HDRI file.

---

### POST `/scenes/:id/thumbnail`

Save a scene thumbnail (base64 PNG from the viewer).

**Request body**
```json
{ "thumbnail": "data:image/png;base64,..." }
```

**Response** — `201 Created`

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
