# Configuration

All configuration is read from environment variables and centralized in [`src/modules/config/config.service.ts`](../src/modules/config/config.service.ts). The `ConfigModule` is a global module — inject `ConfigService` anywhere.

Copy [`.env.example`](../.env.example) to `.env` and fill in your values.

Every variable below maps to a getter in `ConfigService`. Variables in `.env` not listed here are not consumed by the application.

---

## App

| Variable | Default | Required? | Description |
|---|---|---|---|
| `APP_MODE` | `DEVELOPMENT` | no | One of `DEVELOPMENT` / `PRODUCTION` / `TEST`. Affects logging, Swagger exposure, throttler, cookie security. |
| `APP_HOST` | — | yes | Host the server binds to (e.g. `localhost`, `0.0.0.0`). |
| `APP_PORT` | — | yes | TCP port the server listens on (number). |
| `APP_GLOBAL_PREFIX` | `` (empty) | no | URL prefix prepended to every route (e.g. `api` → `/api/...`). |
| `APP_FRONTEND_URL` | — | yes | Public URL of the frontend SPA. Used in email links and CORS-related logic. |

---

## Database (PostgreSQL)

| Variable | Default | Required? | Description |
|---|---|---|---|
| `POSTGRES_HOST` | — | yes | PostgreSQL host. |
| `POSTGRES_PORT` | — | yes | PostgreSQL port (number). |
| `POSTGRES_USER` | — | yes | PostgreSQL username. |
| `POSTGRES_PASSWORD` | — | yes | PostgreSQL password. |
| `POSTGRES_DB` | — | yes | Database name. |

TypeORM is configured with `synchronize: false` (schema is migration-managed), and entities/migrations are loaded from compiled `dist/**/*.entity.js` and `dist/database/migrations/**/*.js`.

---

## JWT / Auth

| Variable | Default | Required? | Description |
|---|---|---|---|
| `AUTH_JWT_COOKIE_NAME` | — | yes | Name of the HttpOnly cookie carrying the access token (e.g. `x-access-token`). The same name is whitelisted in CORS `allowedHeaders`. |
| `AUTH_JWT_ACCESS_SECRET` | — | yes | HS512 signing secret for access tokens. Use a long random string in production. |
| `AUTH_JWT_REFRESH_SECRET` | — | yes | HS512 signing secret for refresh tokens. Must differ from `AUTH_JWT_ACCESS_SECRET`. |
| `AUTH_JWT_ACCESS_EXPIRES` | — | yes | Access token TTL in seconds (e.g. `1800` = 30 minutes). |
| `AUTH_JWT_REFRESH_EXPIRES` | — | yes | Refresh token TTL in seconds (e.g. `432000` = 5 days). |
| `RESET_PASSWORD_EXPIRE_SECONDS` | `3600` | no | TTL of password-reset tokens in seconds. Read in [`user-reset-password.repository.ts`](../src/modules/user/repositories/user-reset-password.repository.ts). |

The JWT is read **only** from the HttpOnly cookie — never from an `Authorization` header. See [auth.md](auth.md).

---

## CORS

| Variable | Default | Required? | Description |
|---|---|---|---|
| `CORS_ORIGINS_WHITE_LIST` | `*` | no | Comma-separated list of allowed origins, or `*` to allow all. |

`credentials: true` is always set; allowed headers and exposed headers are hard-coded in `ConfigService.cors`.

---

## Mail (SMTP, Yandex defaults)

Mail is required only when sending email (org invites, password reset, notifications). When `SMTP_YANDEX_ENABLED=false`, the transport is replaced with a no-op preview transport and the remaining `SMTP_YANDEX_*` vars become optional.

| Variable | Default | Required? | Description |
|---|---|---|---|
| `SMTP_YANDEX_ENABLED` | `false` | no | Toggle real SMTP delivery. When `false`, mail is previewed and not sent. |
| `SMTP_YANDEX_HOST` | `localhost` (when disabled) | only when enabled | SMTP server host. |
| `SMTP_YANDEX_PORT` | `465` | only when enabled | SMTP server port (number). `465` for SSL. |
| `SMTP_YANDEX_AUTH_USER` | `user` (when disabled) | only when enabled | SMTP username; also used as the `From:` address. |
| `SMTP_YANDEX_AUTH_PASS` | `pass` (when disabled) | only when enabled | SMTP password. |
| `SMTP_YANDEX_SENDER_NAME` | `` (when disabled) | only when enabled | Display name used in the `From:` header. |

---

## Bull / Redis

Redis is the queue backend for the webhook delivery queue (`@nestjs/bull`). The same `REDIS_*` vars are used everywhere; there is no separate `BULL_*` prefix.

| Variable | Default | Required? | Description |
|---|---|---|---|
| `REDIS_HOST` | `localhost` | no | Redis host. |
| `REDIS_PORT` | `6379` | no | Redis port (number). |
| `REDIS_USER` | `` (empty) | no | Redis username (Redis 6+ ACL). Empty string disables auth user. |
| `REDIS_PASSWORD` | `` (empty) | no | Redis password. Empty string disables auth. |

---

## Throttler (rate limiting)

| Variable | Default | Required? | Description |
|---|---|---|---|
| `THROTTLE_GLOBAL_TTL` | `60` | no | Time window in seconds (passed through `seconds()` from `@nestjs/throttler`). |
| `THROTTLE_GLOBAL_LIMIT` | `10` | no | Max requests per IP per TTL window. |

In `TEST` mode the throttler is disabled (`throttlers: []`).

---

## File Storage / Encryption

Local filesystem paths are derived at startup from `process.cwd()/files/{avatars,models-3d,embed}` and are not configurable via env. Per-organization S3 storage credentials live in the database; only the encryption key for those secrets is read from env.

| Variable | Default | Required? | Description |
|---|---|---|---|
| `STORAGE_ENCRYPTION_KEY` | `` (empty) | required when any org uses S3 storage or webhooks | AES-256 key (32-byte hex string = 64 chars) used to encrypt org S3 credentials and webhook secrets. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. **Rotating this value breaks all existing encrypted secrets** — orgs would have to re-enter S3 credentials and webhook secrets. |

Used in [`files.service.ts`](../src/modules/files/files.service.ts), [`organization.controller.ts`](../src/modules/organizations/controllers/organization.controller.ts), and [`webhook-crypto.service.ts`](../src/modules/organizations/webhooks/services/webhook-crypto.service.ts).

---

## Logging

| Variable | Default | Required? | Description |
|---|---|---|---|
| `LOGS_LEVEL` | `silly` | no | Minimum Winston log level. One of `error` / `warn` / `info` / `verbose` / `debug` / `silly`. |
| `LOGS_TO_FILE_ENABLED` | `false` | no | When `true`, write logs to file in addition to console. |

---

## Swagger / OpenAPI

| Variable | Default | Required? | Description |
|---|---|---|---|
| `SWAGGER_SERVER` | `http://localhost:8080` | no | Base server URL shown in Swagger UI. |
| `SWAGGER_TITLE` | `MeshHub Swagger` | no | Document title. |
| `SWAGGER_DESCRIPTION` | `The mesh hub API description` | no | Document description. |
| `SWAGGER_VERSION` | `1.0` | no | API version. |

Swagger UI is served at `/swagger`. Access is not restricted to production in the current configuration.

---

## Example `.env`

```dotenv
# App
APP_MODE=DEVELOPMENT
APP_HOST=localhost
APP_PORT=8080
APP_GLOBAL_PREFIX=api
APP_FRONTEND_URL=http://localhost:8000

# Logs
LOGS_LEVEL=silly
LOGS_TO_FILE_ENABLED=false

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=8888
POSTGRES_USER=SuperMesh
POSTGRES_PASSWORD=pass4mesh
POSTGRES_DB=meshhub

# Auth
AUTH_JWT_COOKIE_NAME=x-access-token
AUTH_JWT_ACCESS_SECRET=<random-32+-chars>
AUTH_JWT_REFRESH_SECRET=<random-48+-chars>
AUTH_JWT_ACCESS_EXPIRES=1800
AUTH_JWT_REFRESH_EXPIRES=432000

# Password reset
RESET_PASSWORD_EXPIRE_SECONDS=1800

# Swagger
SWAGGER_SERVER=http://localhost:8080
SWAGGER_TITLE="MeshHub Swagger"
SWAGGER_DESCRIPTION="API приложения MeshHub"
SWAGGER_VERSION=1.0

# Throttle
THROTTLE_GLOBAL_TTL=5
THROTTLE_GLOBAL_LIMIT=30

# CORS
CORS_ORIGINS_WHITE_LIST=*

# Yandex SMTP
SMTP_YANDEX_ENABLED=false
SMTP_YANDEX_HOST=smtp.yandex.ru
SMTP_YANDEX_PORT=465
SMTP_YANDEX_SENDER_NAME=MeshHub
SMTP_YANDEX_AUTH_USER=
SMTP_YANDEX_AUTH_PASS=

# Redis (also used by the Bull webhook delivery queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=
REDIS_PASSWORD=

# Storage encryption (AES-256 key, 32-byte hex = 64 chars)
STORAGE_ENCRYPTION_KEY=
```

---

## Accessing config in code

```typescript
// Inject ConfigService
constructor(private readonly config: ConfigService) {}

// Use typed getters
this.config.app.port
this.config.jwt.accessSecret
this.config.typeOrmOptions
this.config.cors
this.config.throttlerConfig
this.config.mailerConfig
this.config.redis
this.config.storageEncryptionKey
this.config.fsConfig
this.config.isProduction
this.config.isDevelopment
this.config.isTest
```

Do **not** use `process.env` directly in feature code. Always go through `ConfigService`.
