---
name: add-backend-feature
description: Use when adding a new feature module to the MeshHub NestJS backend (`server/`). Scaffolds module + controller + service + repository + mapper + DTOs + entity + migration, registers it in `app.module.ts`, and follows MeshHub conventions.
---

# Add a new backend feature module

Canonical reference: [server/AGENTS.md](../../../server/AGENTS.md#how-to-add-a-new-feature-module). This skill enforces the same checklist with concrete paths and post-step verification.

## Inputs

- Feature name in `kebab-case` (e.g. `material-presets`)
- Owning DB schema (one of: `auth`, `users`, `resources`, `model_3d`, `organizations`, `workspaces`, `embed`, `scenes` — or a new schema if justified)
- Whether the feature owns its own table(s)
- Auth model (default authenticated, restricted by role, or `@Public`)

## Steps

1. **Module folder** — `server/src/modules/<name>/` with:
   - `<name>.module.ts` — `@Module({ imports: [TypeOrmModule.forFeature([...])], controllers, providers, exports })`
   - `controllers/<name>.controller.ts` (split out `controllers/admin.controller.ts` for admin endpoints if any)
   - `services/<name>.service.ts`
   - `repositories/<name>.repository.ts` (extends `Repository<Entity>`; inject via `@InjectRepository`)
   - `mappers/<name>.mapper.ts` (plain class, not a provider)
   - `dto/<name>.response.dto.ts`, `dto/<name>.request.dto.ts` (and per-action variants)

2. **Entity** (if owning a table) — `server/src/database/entities/<schema>/<name>.entity.ts`. Extend `GuidIdEntityBase` (UUID PK) or `IntIdBaseEntity` (serial int PK). Reference table/schema names from `src/database/constants.ts` — add new constants there if needed.

3. **Migration** —
   - `cd server && npm run migration:generate -- --schema=<schema> --name=Add<PascalName>`
   - Inspect the generated file under `server/src/database/migrations/<schema>/`. Strip spurious `ALTER COLUMN` noise that TypeORM sometimes emits.

4. **Wire it up** — add `<Name>Module` to `imports` in `server/src/app.module.ts`. If it exposes services other modules need, list them in `exports`.

5. **Auth & validation** —
   - Apply `@Roles(...)` / `@Public()` / `@Refresh()` per the auth model.
   - Use `@User() user: UserEntity` for the caller; `@OptionalUser()` if both states are valid.
   - `class-validator` decorators on every request DTO field.

6. **Errors** — throw `AppHttpException` from the service. Don't throw raw `HttpException`.

7. **Verify** —
   - `cd server && npm run lint`
   - `cd server && npm run tscheck`
   - `cd server && npm run db:init` (applies the new migration locally)
   - `cd server && npm run swagger:generate` — confirm new endpoints appear in `server/swagger.openapi3.json`

8. **Hand off to client** (if API surface changed) —
   - Identify which client `Api.injectEndpoints` module needs the new endpoint.
   - List the additions required in `client/src/app/api/dto.ts`.

## Don't

- Don't enable `synchronize` — even temporarily.
- Don't query `EntityManager` directly from a service — use the repository.
- Don't read `process.env` — inject `ConfigService`.
- Don't use hard `DELETE` unless explicitly required; prefer soft-delete via the base entity columns.
