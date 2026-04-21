# Configuration

All configuration is read from environment variables and centralized in `src/modules/config/config.service.ts`. The `ConfigModule` is a global module — inject `ConfigService` anywhere.

Copy `.env.example` to `.env` and fill in your values.

---

## Application

| Variable | Type | Default | Description |
|---|---|---|---|
| `APP_MODE` | `DEVELOPMENT` \| `PRODUCTION` \| `TEST` | `DEVELOPMENT` | Affects logging, Swagger exposure, cookie security |
| `APP_HOST` | string | `localhost` | Host the server binds to |
| `APP_PORT` | number | `8080` | Port the server listens on |
| `APP_GLOBAL_PREFIX` | string | `api` | URL prefix for all routes (e.g., `/api`) |
| `APP_FRONTEND_URL` | string | `http://localhost:8000` | Frontend URL (used in email links) |

---

## Logging

| Variable | Type | Default | Description |
|---|---|---|---|
| `LOGS_LEVEL` | `error` \| `warn` \| `info` \| `verbose` \| `debug` \| `silly` | `silly` | Minimum log level for Winston |
| `LOGS_TO_FILE_ENABLED` | boolean | `false` | Write logs to file in addition to console |

---

## Database (PostgreSQL)

| Variable | Type | Default | Description |
|---|---|---|---|
| `POSTGRES_HOST` | string | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | number | `8888` | PostgreSQL port |
| `POSTGRES_USER` | string | `SuperMesh` | PostgreSQL username |
| `POSTGRES_PASSWORD` | string | `pass4mesh` | PostgreSQL password |
| `POSTGRES_DB` | string | `meshhub` | Database name |

TypeORM is configured with:
- `synchronize: false` — use migrations only
- `logging: true` in non-production modes
- `entities` and `migrations` loaded from `src/database/entities/**` and `src/database/migrations/**`

---

## Authentication & JWT

| Variable | Type | Default | Description |
|---|---|---|---|
| `AUTH_JWT_COOKIE_NAME` | string | `x-access-token` | Name of the HttpOnly cookie carrying the JWT |
| `AUTH_JWT_ACCESS_SECRET` | string | — | Secret for signing access tokens (HS512) |
| `AUTH_JWT_REFRESH_SECRET` | string | — | Secret for signing refresh tokens (HS512) |
| `AUTH_JWT_ACCESS_EXPIRES` | number (seconds) | `1800` | Access token TTL (30 minutes) |
| `AUTH_JWT_REFRESH_EXPIRES` | number (seconds) | `432000` | Refresh token TTL (5 days) |

> **Security**: Use long, random strings (≥ 32 chars) for secrets in production. Never commit real secrets to source control.

---

## Password Reset

| Variable | Type | Default | Description |
|---|---|---|---|
| `RESET_PASSWORD_EXPIRE_SECONDS` | number | `1800` | How long a reset token is valid (30 minutes) |

---

## CORS

| Variable | Type | Default | Description |
|---|---|---|---|
| `CORS_ORIGINS_WHITE_LIST` | string | `*` | Comma-separated list of allowed origins, or `*` to allow all |

In `ConfigService.cors`:
- `credentials: true`
- `allowedHeaders`: includes `Authorization`, `Content-Type`, cookie header
- `methods`: standard HTTP methods

---

## Rate Limiting (Throttler)

| Variable | Type | Default | Description |
|---|---|---|---|
| `THROTTLE_GLOBAL_TTL` | number (seconds) | `5` | Time window for rate limiting |
| `THROTTLE_GLOBAL_LIMIT` | number | `30` | Max requests per IP per TTL window |

---

## Swagger / OpenAPI

| Variable | Type | Default | Description |
|---|---|---|---|
| `SWAGGER_SERVER` | string | `http://localhost:8080` | Base server URL shown in Swagger UI |
| `SWAGGER_TITLE` | string | `MeshHub Swagger` | Document title |
| `SWAGGER_DESCRIPTION` | string | `API приложения MeshHub` | Document description |
| `SWAGGER_VERSION` | string | `1.0` | API version |

Swagger UI is served at `/swagger`. Access is not restricted to production in the current configuration.

---

## Email / SMTP (Yandex)

| Variable | Type | Default | Description |
|---|---|---|---|
| `SMTP_YANDEX_ENABLED` | boolean | `false` | Enable email sending |
| `SMTP_YANDEX_HOST` | string | — | SMTP server host |
| `SMTP_YANDEX_PORT` | number | `465` | SMTP server port (SSL) |
| `SMTP_YANDEX_AUTH_USER` | string | — | SMTP username |
| `SMTP_YANDEX_AUTH_PASS` | string | — | SMTP password |
| `SMTP_YANDEX_SENDER_NAME` | string | — | Display name for outgoing emails |

When `SMTP_YANDEX_ENABLED=false`, email sending is silently skipped. The notification service logs a warning instead of throwing an error.

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

# Password reset
RESET_PASSWORD_EXPIRE_SECONDS=1800
```

---

## Accessing Config in Code

```typescript
// Inject ConfigService
constructor(private readonly config: ConfigService) {}

// Use typed getters
this.config.app.port
this.config.app.host
this.config.jwt.accessSecret
this.config.typeOrmOptions
this.config.cors
this.config.throttlerConfig
this.config.isProduction
this.config.isDevelopment
```

Do **not** use `process.env` directly in feature code. Always go through `ConfigService`.
