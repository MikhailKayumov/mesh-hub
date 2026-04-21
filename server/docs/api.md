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
