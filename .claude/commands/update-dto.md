---
description: Sync client/src/app/api/dto.ts against the current server contracts
allowed-tools: Read, Edit, Grep, Glob, Bash(cd server && npm run swagger:generate), Bash(cd client && npm run tscheck)
argument-hint: [endpoint-or-module]
---

Sync the hand-maintained client DTO file at `client/src/app/api/dto.ts` against the current server contracts.

Argument: `$ARGUMENTS` — optional. If given, scope changes to that module/endpoint (e.g. `models-3d` or `auth/login`). If omitted, do a full audit.

Workflow:

1. Check whether `server/swagger.openapi3.json` is current. If it's older than recent changes in `server/src/modules/`, suggest running `/swagger` first; otherwise proceed.
2. Diff request/response shapes for the affected scope between:
   - `server/src/modules/<scope>/dto/*.dto.ts` (source of truth)
   - `client/src/app/api/dto.ts` (current client copy)
3. For each mismatch, edit `client/src/app/api/dto.ts` to match. Preserve the file's existing organization — don't reorder unrelated types.
4. Run `cd client && npm run tscheck` and fix any new type errors caused by the DTO update.
5. Report changed types and any call sites that may need attention.

Do **not** touch `server/` files. Do **not** rename DTO fields without flagging it explicitly — renames are breaking.
