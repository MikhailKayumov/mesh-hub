# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Source of Truth

This repo already maintains LLM-oriented architecture docs. **Read the relevant one before editing code in that workspace** — they cover module layout, naming, patterns, and invariants in detail:

- [AGENTS.md](AGENTS.md) — monorepo overview, auth flow, schema map, FSD rules, key constraints
- [server/AGENTS.md](server/AGENTS.md) — NestJS backend conventions
- [client/AGENTS.md](client/AGENTS.md) — React SPA / FSD / RTK Query conventions

`.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` are also in force; the latter apply by `applyTo` glob (e.g. `nestjs.instructions.md` for `server/**/*.ts`).

When `AGENTS.md` (any level) and this file conflict, AGENTS.md wins — it is more detailed and kept current alongside the code.

## Repo Shape

Monorepo with two independent npm workspaces:

- `server/` — NestJS 11 + TypeORM 0.3 + PostgreSQL 18 (8 schemas: `auth`, `users`, `resources`, `model_3d`, `organizations`, `workspaces`, `embed`, `scenes`)
- `client/` — React 19 + Vite 8 + Mantine 9 + RTK Query + Three.js, organized as Feature-Sliced Design

There is no root `package.json`. Each workspace is built and run separately. Default ports: API `8080`, client dev `8000`, Postgres `5432` (docker dev) / `8888` (local default).

Path alias `@/` → `src/` is configured for both workspaces.

## Common Commands

### Server (`cd server`)

```bash
npm run start:dev          # watch mode
npm run start:prod         # run compiled dist/main
npm run build              # nest build
npm run lint               # eslint src/
npm run tscheck            # tsc --noEmit

# Database (TypeORM, never use synchronize — schema is migration-managed)
npm run db:init            # create schemas + run all migrations
npm run db:init:hard       # DROP + recreate schemas, then migrate
npm run db:seeds           # seed roles + reference data
npm run db:build           # db:init + db:seeds
npm run migration:generate -- --schema=<schema> --name=<Name>
npm run migration:run
npm run migration:revert

# Tests — ALL specs live under server/test/<kind>/, never alongside source
npm test                   # unit  (jest --config ./test/unit/jest.config.json)
npm run test:e2e           # e2e   (jest --config ./test/e2e/jest.config.json + supertest)
npm run test:cov
npx jest --config ./test/unit/jest.config.json path/to/file.spec.ts    # single test file
npx jest --config ./test/unit/jest.config.json -t "test name fragment" # single test by name

# OpenAPI export
npm run swagger:generate   # builds, then writes server/swagger.openapi3.json
```

### Client (`cd client`)

```bash
npm run dev                # vite, port 8000
npm run build              # tsc + vite build
npm run preview            # serve dist/
npm run lint               # eslint .
npm run tscheck            # tsc --noEmit
```

### Docker

```bash
docker compose -f docker-compose.dev.yml up --build   # db only; run api+client locally
docker compose up --build -d                          # full prod stack (db + api + nginx-served client)
```

## Load-Bearing Invariants

These are easy to violate accidentally and break things across the stack:

**Backend**
- Every endpoint is authenticated by default via the global `JwtAuthGuard`. Use `@Public()` to opt out, `@Roles(...)` to restrict, `@Refresh()` only for `/auth/refresh`. JWT is read **only from HttpOnly cookie** — never the `Authorization` header.
- Throw `AppHttpException` for app errors. Don't throw raw `HttpException` or `Error`; they bypass the unified `{ error, type, status, message, data }` shape.
- Never `EntityManager.query` from a service — go through the entity's repository class. Entity ↔ DTO conversion goes through the entity's mapper class (mappers are plain classes, not providers).
- Do not access `process.env` in feature code. Inject `ConfigService` from `src/modules/config/`.
- All entities extend `GuidIdEntityBase` or `IntIdBaseEntity` (both add `createdAt`/`updatedAt`/`deletedAt`). Prefer soft-delete; reference table/schema names from `src/database/constants.ts`.
- `synchronize: false` — schema is managed by migrations only.
- File storage goes through `FileStorageService` → `IFileStorageStrategy` (`FsFileStorageStrategy` for local, `S3FileStorageStrategy` per-org). Don't write directly to disk.

**Frontend (FSD)**
- Strict one-directional imports: `app → pages → widgets → entities → shared`. Never import upward (`shared` cannot reference `widgets`, etc.).
- Single RTK Query base instance: `Api` in `src/app/api/base.ts`. New endpoints go through `Api.injectEndpoints({ ..., overrideExisting: true })` — never `createApi` again.
- Auth refresh in `baseQuery` is mutex-locked (`async-mutex`); don't add a second refresh path.
- Three.js logic lives in plain TS classes under `widgets/Model3DViewer/classes/` (`Viewer`, `CameraController`, `Renderer`, `World`); React touches it only via the `useViewer` hook.
- SCSS modules: `_mantine.scss` is auto-injected via `vite.config.ts` `additionalData` with `as *`. Do not `@use` or `@import` it manually. Use the global `light`/`dark`/`hover`/`rtl`/`ltr` mixins and the `rem(px)` function directly.
- Client DTOs in `client/src/app/api/dto.ts` are maintained by hand. When backend response/request shapes change, edit `dto.ts` to match (regenerate `swagger.openapi3.json` server-side as a reference).

**Tests**
- All test files live under `<workspace>/test/<kind>/` — never co-located with source. Backend kinds today: `server/test/unit/` (mocked deps, no DB) and `server/test/e2e/` (Supertest + real Nest app). Each kind has its own `jest.config.json` and is invoked via a dedicated script in `package.json`.
- Adding a new test kind (integration, contract, smoke, …) means creating `test/<kind>/jest.config.json` and a corresponding `npm` script — do not put specs anywhere else.

## Naming

Backend uses `kebab-case.entity.ts` / `kebab-case.[qualifier].dto.ts` files with `PascalCase` classes ending in `Entity` or `Dto`. DB schemas/tables/columns are `snake_case`. Migrations: `{timestamp}-{PascalCaseName}.ts`.

Frontend components are `PascalCase.tsx` with named exports; hooks `useCamelCase.ts`; SCSS `Component.module.scss`; per-feature local types live in `model.ts` and are not re-exported through `index.ts`.

## Adding Things

- **New backend module**: scaffold `src/modules/<name>/` (module + controller + service + repository + mapper + dto/), add entity + constants, `TypeOrmModule.forFeature([...])`, generate migration, register in `app.module.ts`. Detailed checklist: [server/AGENTS.md](server/AGENTS.md#how-to-add-a-new-feature-module).
- **New widget**: `src/widgets/<Name>/{index.tsx, Name.tsx, Name.module.scss?}`, import only from `entities/`/`shared/`, public surface via `index.tsx`.
- **New API endpoint** (end-to-end): controller method (with auth decorators) → service → repository → request DTO with `class-validator`, then add to client `Api.injectEndpoints` with appropriate `providesTags`/`invalidatesTags` and update `dto.ts`.

## Working Guidelines

### Always respond in English
- All reasoning/thinking and user-facing responses must be written in English, regardless of the language of the user's prompt.
- This applies to commit messages, PR descriptions, code comments, and any other written output.

### Use context7 for library documentation
- When a task involves library/framework/SDK/API/CLI specifics (syntax, configuration, version migration, setup, CLI usage), fetch current docs via the `context7` MCP server (`resolve-library-id` → `query-docs`) instead of relying on training data.
- Applies even to well-known libraries used here (Next.js, React, NestJS, TypeORM, Tailwind, Mantine, TanStack Query, BullMQ, etc.) — versions move faster than model knowledge.
- Prefer context7 over web search for library docs. Skip it for refactoring, business-logic debugging, code review, or general programming concepts.

### Clarify before coding
- Ask when the ambiguity would **materially change the implementation** (scope, contract, side effects, file location, public API). For cosmetic or local choices, state the assumption inline and proceed — don't stop the work to ask.
- If multiple interpretations exist that affect the result, present them — don't pick silently.
- State assumptions explicitly. If a simpler approach exists, say so.

### Minimal, surgical changes
- Only write code that directly addresses the request. No speculative features, unnecessary abstractions, or "just in case" error handling.
- When editing existing code: don't reformat code outside your changes and don't "tidy up" unrelated comments or whitespace. If the editor's autoformatter rewrites the file on save, that's expected — revert only the changes that aren't yours. Match existing style even if you'd write it differently.
- If your changes make something unused — remove it. If you spot pre-existing dead code — mention it in your report, don't delete it. (Overrides the default "delete unused code" behavior — keeps PRs scoped and lets you decide when to clean up separately.)
- Every changed line should trace directly to the user's request.

### Verify your work
- For bug fixes and non-trivial features: turn the task into a verifiable goal first (reproduce → fix → confirm). For doc / config / single-line edits, name the verification step instead (`tscheck passes`, `swagger regenerates`, `feature renders`).
- For multi-step tasks, state a brief plan with verification checkpoints.
- Loop until the goal is confirmed met — don't declare success without evidence.

### Response style
- End-of-turn summaries: 1–2 sentences max. No "What I changed / Next steps" sections unless the user asks.
- No emojis. No filler ("Great question!", "Let me ...").
- File references as clickable markdown links: `[file.ts:42](path#L42)`.
