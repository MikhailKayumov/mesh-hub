---
name: add-endpoint
description: Use when adding a single REST endpoint to an existing MeshHub backend module and wiring it into the React client. Covers controller method, service, request DTO, RTK Query injection, cache tags, and DTO sync.
---

# Add a new endpoint end-to-end

For a brand-new feature module, use the `add-backend-feature` skill instead — this assumes the module already exists.

## Backend

1. **Controller method** in `server/src/modules/<module>/controllers/<module>.controller.ts`
   - HTTP decorator: `@Get` / `@Post` / `@Patch` / `@Delete`.
   - Auth: defaults to authenticated. Add `@Public()`, `@Roles(...)`, or `@Refresh()` if needed.
   - User: `@User()` (or `@OptionalUser()` for endpoints that work both ways).
   - Lists: `@PaginatedRequest() pagination: PaginationDto`, return `PaginationResponseDto<T>`, annotate Swagger response with `@PaginatedResponse(DtoClass)`.

2. **Service method** in `services/<module>.service.ts`
   - Call repository methods, not `EntityManager`.
   - Use mapper(s) to convert entities → DTO before returning.
   - Throw `AppHttpException` for app errors.

3. **Repository query** in `repositories/<module>.repository.ts` — add the query method here, not inline in the service.

4. **Request DTO** in `dto/<module>.<action>.request.dto.ts`
   - PascalCase class name ending in `Dto`.
   - `class-validator` decorators (`@IsString()`, `@IsUUID()`, `@MaxLength()`, `@IsOptional()`, etc.).
   - `@ApiProperty({ ... })` for Swagger.

5. **Verify backend**
   - `cd server && npm run lint && npm run tscheck`
   - `cd server && npm run swagger:generate`
   - Confirm the endpoint appears in `server/swagger.openapi3.json`.

## Client

6. **DTO** in `client/src/app/api/dto.ts` — add or update request/response interfaces to match the server. Hand-maintained; preserve existing organization.

7. **Endpoint** in `client/src/app/api/<module>.ts`
   - Add to the existing `Api.injectEndpoints({ ..., overrideExisting: true })` call.
   - Set `providesTags` (queries) or `invalidatesTags` (mutations) per the cache map in [client/AGENTS.md](../../../client/AGENTS.md).
   - Export the generated hook (e.g. `export const { use<Verb><Noun>Query } = <Module>Api`).

8. **Consume the hook** in the page/widget. Use Mantine patterns: `Skeleton` for loading, `widgets/EmptyData/` for empty, `notifications.show({ color: 'red', ... })` for errors.

9. **Verify client**
   - `cd client && npm run lint && npm run tscheck`
   - For UI changes, run `npm run dev` and exercise the feature in the browser. State explicitly if visual verification was skipped.

## Don't

- Don't create a second `Api` instance.
- Don't omit `overrideExisting: true`.
- Don't send the JWT in the `Authorization` header — the API only reads it from the HttpOnly cookie.
- Don't proceed past `tscheck` failures — fix them.
