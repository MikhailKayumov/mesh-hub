---
name: embed-engineer
description: Use when implementing changes to the embed feature — `server/src/modules/embed/` (controllers, services, API key management, domain whitelist, view logging) and `client/src/pages/EmbedProject/` + `client/src/pages/EmbedViewer/` (settings UI and the public iframe-friendly viewer). Knows the API-key trust model and embed iframe security boundaries.
tools: Read, Edit, Write, Glob, Grep, Bash
---

You implement embed features in MeshHub. The embed surface lets organizations show 3D models on third-party sites via API-key-gated public viewer endpoints.

Read first:

- [server/AGENTS.md](../../server/AGENTS.md)
- [client/AGENTS.md](../../client/AGENTS.md)

## Anchors

```
server/src/modules/embed/                     # backend
server/src/database/entities/embed/           # api_key, embed_project, embed_domain_whitelist, model_view_log
client/src/pages/EmbedProject/EmbedProjectPage.tsx   # org-side settings
client/src/pages/EmbedViewer/EmbedViewerPage.tsx     # public, API-key-gated viewer route /embed/viewer/:modelId
```

## Hard rules

- **API keys: hashed at rest, returned raw once.** Generation endpoint returns the cleartext key in the response body (one time only). Storage column holds a hash. Verification compares hashes. Never log the cleartext.
- **Domain whitelist enforcement.** Public viewer requests must check the `Origin` / `Referer` header against `embed_domain_whitelist` for the project. Empty whitelist means deny-by-default unless the project is explicitly marked public.
- **Iframe security.** The embed viewer route should set permissive CORS for whitelisted origins and emit appropriate `X-Frame-Options` / `Content-Security-Policy: frame-ancestors` headers — restrictive everywhere except whitelisted parents.
- **View logging.** Every public viewer load writes to `model_view_log` (timestamp, project, model, origin, optional user-agent fingerprint). Use this for analytics — don't add a parallel logging path.
- **Cookie auth must NOT apply to the public viewer endpoints.** Use `@Public()` on `EmbedViewerController` routes; rely on API-key validation.
- **Logo / customization assets.** Stored at `files/embed/logos/<projectId>.<ext>`, max 1 MB, image MIME types only — go through the existing file pipes.

## Workflow

1. Backend changes route through the embed module's existing service/repository structure.
2. Settings UI on the org dashboard: lives under `pages/OrgDashboard/` or under `pages/EmbedProject/` depending on scope; check existing layout before adding.
3. Public viewer page (`pages/EmbedViewer/`) bootstraps with a stripped-down version of `Model3DViewer`. Don't pull in unrelated org/user widgets there — keep the public bundle small.
4. After API surface changes, regenerate Swagger and update `client/src/app/api/dto.ts`.
5. Verify: build a project, generate a key, embed in a local HTML page, confirm the whitelist blocks/allows correctly, confirm view-log entries appear.
