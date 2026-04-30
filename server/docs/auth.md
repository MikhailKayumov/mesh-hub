# Authentication & Authorization

## Overview

MeshHub uses **JWT-based authentication with server-side session storage**. Tokens are transmitted exclusively via **HttpOnly cookies** to prevent XSS token theft. Sessions are persisted in the `auth.session` table, enabling real logout and active session management.

---

## Token Types

| Token | Cookie name | Default TTL | Env var |
|---|---|---|---|
| Access token | `AUTH_JWT_COOKIE_NAME` (e.g., `x-access-token`) | 30 minutes | `AUTH_JWT_ACCESS_EXPIRES` |
| Refresh token | Same cookie during refresh flow | 5 days | `AUTH_JWT_REFRESH_EXPIRES` |

Both tokens are signed with **HS512** algorithm.

- `AUTH_JWT_ACCESS_SECRET` — secret for access token
- `AUTH_JWT_REFRESH_SECRET` — secret for refresh token

---

## Auth Flow

### Signup / Login

```
Client                          Server
  │                               │
  ├── POST /auth/signup ─────────►│
  │   (or /auth/login)            │  1. Validate credentials
  │                               │  2. Hash password (pbkdf2, 64 bytes, sha512)
  │                               │  3. Look up / create user
  │                               │  4. Create SessionEntity in DB
  │                               │     (deduplication by IP + userAgent)
  │                               │  5. Sign access + refresh JWT
  │◄── 200 OK + Set-Cookie ───────│     (CookiesInterceptor sets cookie)
```

### Authenticated Request

```
Client                          Server
  │                               │
  ├── GET /protected ────────────►│ [cookie: x-access-token=<jwt>]
  │                               │  1. ThrottlerBehindProxyGuard (rate limit)
  │                               │  2. JwtAuthGuard:
  │                               │     a. Read token from cookie
  │                               │     b. Verify signature + expiry
  │                               │     c. Load SessionEntity from DB
  │                               │        (validates session exists & not expired)
  │                               │     d. Check @Roles() if present
  │                               │     e. Attach session to req.session
  │                               │  3. Controller / Service
  │◄── 200 OK ────────────────────│
```

### Token Refresh

```
Client                          Server
  │                               │
  ├── POST /auth/refresh ────────►│ [cookie: x-access-token=<refresh_jwt>]
  │   (@Refresh decorator)        │  1. JwtAuthGuard reads refresh token
  │                               │  2. Validates refresh token signature
  │                               │  3. Loads session from DB
  │                               │  4. Issues new access + refresh tokens
  │                               │  5. Updates session in DB
  │◄── 200 OK + Set-Cookie ───────│
```

### Logout

```
Client                          Server
  │                               │
  ├── POST /auth/logout ─────────►│
  │                               │  1. Load session from req.session
  │                               │  2. Delete SessionEntity from DB
  │                               │  3. CookiesInterceptor clears cookie
  │◄── 200 OK ────────────────────│
```

---

## JWT Payload

```typescript
interface JwtPayload {
  sub: string;      // session ID (UUID)
  iat: number;      // issued at
  exp: number;      // expires at
}
```

The `sub` field holds the **session ID**, not the user ID. The user is resolved by loading the session with its user relation.

---

## Session Entity

Stored in `auth.session` table:

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Session ID (used as JWT `sub`) |
| `user_id` | UUID (FK) | Owner user |
| `access_token` | text | Latest access token (unique) |
| `refresh_token` | text | Latest refresh token (unique) |
| `ip` | inet | Client IP at session creation |
| `user_agent` | text | Client user agent |
| `expired_at` | timestamp | Session expiry |
| `created_at` | timestamp | Session creation time |

Session deduplication: when a user logs in from the same IP + user agent, the existing session is replaced instead of creating a duplicate.

---

## Guard Chain

### JwtAuthGuard (`src/guards/auth/jwt-auth.guard.ts`)

Applied globally as `APP_GUARD`. Executed on every request.

**Decision tree:**

```
Request arrives
    │
    ├─ Has @Public() metadata?
    │      └─ YES → skip auth, allow request
    │
    ├─ Has @Refresh() metadata?
    │      └─ YES → validate refresh token (not access token)
    │
    ├─ Read cookie (AUTH_JWT_COOKIE_NAME)
    │      └─ Missing → throw 401 Unauthorized
    │
    ├─ Verify JWT signature
    │      └─ Invalid → throw 401 Unauthorized
    │
    ├─ Check token expiry
    │      └─ Expired → throw 401 Unauthorized
    │
    ├─ Load SessionEntity from DB by payload.sub
    │      └─ Not found or expired → throw 401 Unauthorized
    │
    ├─ Has @Roles() metadata?
    │      └─ YES → check user.roles against required roles
    │             └─ Missing role → throw 403 Forbidden
    │
    └─ Attach session to req.session → proceed
```

### ThrottlerBehindProxyGuard (`src/guards/throttler-behind-proxy.guard.ts`)

Extends `ThrottlerGuard`. Overrides `getTracker()` to extract the real client IP from the `X-Forwarded-For` header. Applied before `JwtAuthGuard`.

---

## Auth Decorators

All decorators are in `src/decorators/auth/`.

### `@Public()`
Marks a route as publicly accessible. The `JwtAuthGuard` skips token validation entirely.

```typescript
@Public()
@Get('list')
async getList() { ... }
```

### `@Refresh()`
Signals the guard to validate the **refresh** token instead of the access token. Used only on `POST /auth/refresh`.

```typescript
@Refresh()
@Post('refresh')
async refresh() { ... }
```

### `@Roles(...roles: UserRoles[])`
Requires the authenticated user to have at least one of the specified roles.

```typescript
@Roles(UserRoles.Admin, UserRoles.SuperUser)
@Get('admin-only')
async adminRoute() { ... }
```

Available roles (from `src/constants/roles.ts`):
- `UserRoles.SuperUser` = `'super-user'`
- `UserRoles.Admin` = `'admin'`
- `UserRoles.User` = `'user'`

### `@AuthGuard()`
Composite decorator that applies `@Roles(UserRoles.User)` and adds Swagger security annotations. Use on standard authenticated endpoints.

---

## User Decorators

### `@User()`
Injects the `UserEntity` from `req.session.user`.

```typescript
@Get('current')
async getCurrent(@User() user: UserEntity) { ... }
```

### `@OptionalUser()`
Injects the user if authenticated, `undefined` otherwise. Use on public endpoints that optionally personalize the response (e.g., `isOwner` flag on models).

```typescript
@Public()
@Get(':id')
async getModel(@Param('id') id: string, @OptionalUser() user?: UserEntity) { ... }
```

---

## Cookie Configuration

The `CookiesInterceptor` (`src/interceptors/cookies.interceptor.ts`) runs after every response and manages the JWT cookie:

| Cookie attribute | Value |
|---|---|
| `httpOnly` | `true` (not accessible via JS) |
| `secure` | `true` in production |
| `sameSite` | `lax` |
| `expires` | Set to `session.expiredAt` |

To clear the cookie (on logout), the interceptor sets `maxAge: 0`.

---

## Password Hashing

Passwords are hashed using **PBKDF2** with:
- Hash function: **SHA-512**
- Output length: 64 bytes
- Salt: randomly generated per user (stored in `user.salt` column)

Password strength requirements (from `src/constants/regexp.ts`):
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

---

## Password Reset Flow

1. `POST /user/reset-password` — client submits email
2. Server creates a `UserResetPasswordEntity` with a UUID and an expiry (`RESET_PASSWORD_EXPIRE_SECONDS`)
3. Server sends the UUID to the user's email via `NotificationsModule`
4. Client follows the link with the UUID to the frontend
5. Frontend submits `POST /user/new-password` with `{ resetId, newPassword, confirmNewPassword }`
6. Server loads the `UserResetPasswordEntity` by ID, verifies it is not expired, updates the password, and deletes the reset record

---

## RBAC (Role-Based Access Control)

Roles are stored in `users.role` and assigned to users via the `users.user_role` join table (many-to-many). Roles are loaded eagerly with the user.

Utility helpers in `src/utils/user-role.helper.ts`:
- `hasRole(user, role)` — user has exactly this role
- `hasSomeRoles(user, roles[])` — user has at least one of the roles
- `hasEveryRoles(user, roles[])` — user has all roles

The default role assigned to new users at signup is `UserRoles.User`.

---

## API Key Authentication

Used by the public embed viewer endpoint (`GET /embed/:targetId`). API keys belong to an organization, not a user, and never exchange for a session.

### Header

| Header | Value |
|---|---|
| `x-api-key` | Raw API key string of the form `<prefix>_<random>` |

The raw key is **not** stored. The server stores only a SHA-256 hex digest:

```typescript
const keyHash = createHash('sha256').update(rawKey).digest('hex');
```

(See [`api-key.guard.ts`](../src/modules/api-keys/guards/api-key.guard.ts).)

### Lifecycle

| Endpoint | Behaviour |
|---|---|
| `POST /api-keys` | Generates a new key. The response includes `rawKey` **once**; subsequent reads only expose the `prefix`. |
| `GET /api-keys?orgId=...` | Lists keys for an org. `rawKey` is never returned here. |
| `DELETE /api-keys/:id?orgId=...` | Sets `revoked_at`; revoked keys are rejected by the guard. |

The create response DTO documents this contract:

```typescript
// src/modules/api-keys/dto/api-key.response.dto.ts
/** Present only in the create response — shown once, never stored. */
@ApiProperty({ nullable: true })
public rawKey?: string;
```

### `ApiKeyEntity` (`embed.api_key`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | text | Human-readable label |
| `prefix` | varchar(8), unique | First 8 chars of the random part; safe to show in UI |
| `key_hash` | text, unique | SHA-256 hex of the full raw key |
| `scopes` | text[] | Default `['embed:read']` |
| `org_id` | UUID (FK → `organizations.organization`) | Owning organisation |
| `last_used_at` | timestamptz, nullable | Updated fire-and-forget by the guard |
| `expires_at` | timestamptz, nullable | If past, guard returns 401 |
| `revoked_at` | timestamptz, nullable | If set, guard returns 401 |

### Scopes

Defined in [`api-key.constants.ts`](../src/modules/api-keys/api-key.constants.ts):

```typescript
export const ApiKeyScopes = ['embed:read', 'read:models', 'read:scenes'] as const;
```

Today only `embed:read` is enforced on any endpoint (`GET /embed/:targetId`). The other two scopes are reserved for future use.

### `@RequiredScope(scope)`

Declarative gate consumed by `ApiKeyGuard`:

```typescript
@Public()
@UseGuards(ApiKeyGuard)
@RequiredScope('embed:read')
@Get(':targetId')
public getEmbedViewer(...) { ... }
```

If the loaded key's `scopes` array does not include the required scope, the guard throws `AppHttpException(..., 403)`.

### Guard decision tree

```
Request arrives at endpoint with @UseGuards(ApiKeyGuard)
    │
    ├─ Read header x-api-key
    │      └─ Missing or non-string → throw 401 Unauthorized
    │
    ├─ Hash with SHA-256, look up by key_hash
    │      └─ Not found → throw 401 Unauthorized
    │
    ├─ revoked_at !== null → throw 401 Unauthorized
    │
    ├─ expires_at !== null && expires_at < now → throw 401 Unauthorized
    │
    ├─ @RequiredScope present and missing from key.scopes
    │      └─ throw 403 Forbidden (AppHttpException)
    │
    ├─ Update last_used_at (fire-and-forget, non-blocking)
    │
    └─ Attach api_key to request.apiKey → proceed
```

The downstream service reads `request.apiKey` to scope its work to `apiKey.orgId`.

---

## Org-Member RBAC

For org-scoped resources (organisations, workspaces, embed projects, etc.), authorisation is layered on top of `JwtAuthGuard`: after the user is authenticated, `OrgMemberGuard` confirms they are a member of the target org with at least the required role.

### `OrgMemberRole` enum

Defined in [`org-member.entity.ts`](../src/database/entities/organizations/org-member.entity.ts):

| Role | Weight |
|---|---|
| `Owner` (`owner`) | 3 |
| `Admin` (`admin`) | 2 |
| `Editor` (`editor`) | 1 |
| `Viewer` (`viewer`) | 0 |

Higher weight = more privileged. A required role of `Admin` is satisfied by `Admin` or `Owner`.

### `OrgMemberGuard` (`src/modules/organizations/guards/org-member.guard.ts`)

Reads `request.params['id']` as the organisation UUID and `request.session.user.id` as the current user. Loads the matching `org_member` row and attaches it to `request.orgMember`.

```
Request arrives at endpoint decorated with @OrgMemberRole(...)
    │
    ├─ Read params.id (org UUID) and session.user.id
    │      └─ Either missing → throw 403 Forbidden
    │
    ├─ orgMemberRepository.findByOrgAndUser(orgId, userId)
    │      └─ Not found → throw 403 Forbidden
    │
    ├─ Attach member to request.orgMember
    │
    ├─ No required roles set → allow
    │
    ├─ memberWeight < min(requiredWeights) → throw 403 Forbidden
    │
    └─ proceed
```

The guard uses only the URL param named `id`. Routes that use a different param name (e.g. `:orgId`) cannot be guarded by `OrgMemberGuard` directly today — services that span multiple org-scoped IDs do their own membership check via `EmbedService.requireMembership` and similar helpers.

### `@OrgMemberRole(...roles)`

Composite decorator that sets the metadata key and applies `UseGuards(OrgMemberGuard)`:

```typescript
// src/modules/organizations/guards/org-member-role.decorator.ts
@OrgMemberRole(OrgMemberRole.Admin)
@Patch(':id')
public updateOrg(@Param('id', ParseUUIDPipe) id: string, ...) { ... }
```

Pass multiple roles to express "any of these or higher": the guard takes the **minimum** required weight across the list.

---

## Embed Public Viewer Auth Flow

`GET /embed/:targetId` is the only endpoint that uses `ApiKeyGuard` today. It is `@Public()` (no JWT required) but `@UseGuards(ApiKeyGuard)` + `@RequiredScope('embed:read')`. The handler also receives the `Origin` header for the domain whitelist check, which lives in `EmbedService.assertOriginAllowed`.

```
Browser / iframe                Server
  │                               │
  ├── GET /embed/:targetId ──────►│ [header: x-api-key=<raw_key>]
  │   [Origin: https://site.tld]  │  1. JwtAuthGuard sees @Public() → skip auth
  │                               │  2. ApiKeyGuard:
  │                               │     a. SHA-256(rawKey) → look up api_key
  │                               │     b. Reject if not found / revoked / expired
  │                               │     c. Check @RequiredScope('embed:read')
  │                               │     d. Attach api_key to req
  │                               │  3. EmbedService.getEmbedViewer:
  │                               │     a. Load embed_project for targetId
  │                               │     b. project.orgId === apiKey.orgId? else 403
  │                               │     c. assertOriginAllowed(project, origin)
  │                               │     d. Load model or scene, log view, map DTO
  │◄── 200 OK + viewer payload ───│
```

### Domain whitelist (`EmbedService.assertOriginAllowed`)

The check lives in the service, not the guard:

```typescript
// src/modules/embed/services/embed.service.ts
private assertOriginAllowed(project: EmbedProjectEntity, origin: string | undefined): void {
  if (origin === undefined) return;
  // ...
  const whitelist = project.domains ?? [];
  if (whitelist.length === 0) {
    throw new ForbiddenException('Embed domain whitelist is not configured');
  }
  const allowed = whitelist.some((d) => d.domain === requestHostname);
  if (!allowed) throw new ForbiddenException('Origin not in domain whitelist');
}
```

Concrete behaviour:

| Request shape | Result |
|---|---|
| No `Origin` header (e.g. server-to-server, `curl`) | Check is **skipped** — passes. |
| `Origin` present, whitelist empty | **403 Forbidden** (`'Embed domain whitelist is not configured'`). The whitelist is fail-closed for browser callers. |
| `Origin` present, hostname matches a whitelist entry exactly | Passes. |
| `Origin` present, hostname does not match | **403 Forbidden** (`'Origin not in domain whitelist'`). |
| `Origin` present but not parseable as a URL | **403 Forbidden** (`'Invalid Origin header'`). |

Comparison is done on `new URL(origin).hostname`, so the whitelist stores bare hostnames (no scheme, no port).

---

## See also

- [embed.md](./embed.md) — embed projects, viewer payload, domain whitelist storage
- [organizations.md](./organizations.md) — org membership, invites, ownership transfer
- [model-3d.md](./model-3d.md) — model visibility and ownership rules
- [api.md](./api.md) — full endpoint catalogue with required guards/scopes
