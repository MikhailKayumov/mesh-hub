---
description: Build the server and export the OpenAPI 3 spec to server/swagger.openapi3.json
allowed-tools: Bash(cd server && npm run swagger:generate), Bash(git diff:*), Bash(ls:*)
---

Regenerate the OpenAPI spec.

Run `cd server && npm run swagger:generate`. This builds the server (`nest build`) and then writes `server/swagger.openapi3.json` from the live Swagger document.

After completion, summarise briefly:
- Build success / failure
- Modification time and size of `server/swagger.openapi3.json`
- Best-effort list of new top-level paths since the previous version (use `git diff --stat server/swagger.openapi3.json` and `git diff server/swagger.openapi3.json | head -200`)

`swagger.openapi3.json` is the source of truth for the backend's exposed surface; the client `dto.ts` is hand-maintained against it. Suggest `/update-dto` if the user is about to update client types.
