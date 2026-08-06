---
name: add-rtk-endpoint
description: Use when adding only the client-side RTK Query endpoint for an already-shipped server endpoint. Narrower than `add-endpoint` (which covers the full backend → client flow). Covers `Api.injectEndpoints`, cache tags, and the corresponding `dto.ts` additions.
---

# Add a single RTK Query endpoint

Use when the server-side endpoint already exists and you just need to wire it into the client.

## Inputs

- HTTP method, URL path, and DTO shapes (request and response) — copy from `server/swagger.openapi3.json` if needed
- The owning client module file (e.g. `client/src/app/api/models-3d.ts`)
- The relevant cache tag(s) — see [client/AGENTS.md](../../../client/AGENTS.md) cache map

## Steps

1. **DTOs in `client/src/app/api/dto.ts`.** Add or update interfaces to match the server. Hand-maintained; don't reorganize unrelated entries.

2. **Inject endpoint** into the existing module:
   ```ts
   export const ModelsApi = Api.injectEndpoints({
     endpoints: (build) => ({
       newEndpoint: build.query<ResponseDto, RequestDto>({
         query: (req) => ({
           url: ApiUrls.SomePath,
           method: 'GET',
           params: req,
         }),
         providesTags: [ApiTags.SomeTag],
       }),
     }),
     overrideExisting: true,    // always required
   });
   ```

3. **URL constants** — add the path to `client/src/app/api/urls.ts` (`ApiUrls`). Don't inline URL strings in the endpoint definition.

4. **Cache tags** — wire `providesTags` (queries) and `invalidatesTags` (mutations). Reference the map in `client/AGENTS.md`. New tag → also add to `client/src/app/api/tags.ts` `ApiTags` and to the base `Api` `tagTypes` array.

5. **Export the hook**:
   ```ts
   export const { useNewEndpointQuery } = ModelsApi;
   ```

6. **Verify**: `cd client && npm run lint && npm run tscheck`. If a consuming page exists, exercise the hook in the browser.

## Anti-patterns

- Don't create a new `createApi` instance.
- Don't inline URLs — use `ApiUrls`.
- Don't omit `overrideExisting: true`.
- Don't invalidate `Reset` tag for routine updates — it's a hard reset for things like all-sessions logout.
- Don't mutate Redux state directly to "fake" the result — let the cache tag system invalidate and refetch.

## When to use the broader `add-endpoint` skill instead

If you're also writing the controller method, service, repository query, and request DTO — use `add-endpoint`. Use this narrower skill only when the server side is genuinely already done.
