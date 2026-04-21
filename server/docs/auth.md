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
