# Claude Code Setup

Project-tailored configuration for Claude Code — Claude-native counterpart to `.github/` (which is for GitHub Copilot and is not auto-loaded here).

## Layout

- [agents/](agents/) — subagents auto-invoked by description match (used via the `Agent` tool)
- [commands/](commands/) — project slash-commands
- [skills/](skills/) — invokable how-to skills (used via the `Skill` tool)

## Subagents

### Implementation agents (write code)

| Agent | When |
|---|---|
| [agents/nestjs-backend.md](agents/nestjs-backend.md) | NestJS modules / services / repositories / DTOs / mappers |
| [agents/fsd-frontend.md](agents/fsd-frontend.md) | React UI in `client/` (FSD, RTK Query, Mantine) — **non-3D** |
| [agents/threejs-engineer.md](agents/threejs-engineer.md) | Three.js class stack — `Viewer`, `Renderer`, `World`, `Camera`, `Lights`, `Loader`, `Destroyer` |
| [agents/scene-editor-engineer.md](agents/scene-editor-engineer.md) | Scene editor — `pages/SceneEditor/`, scene panels, `scene_object`/`scene_light` |
| [agents/model-display-engineer.md](agents/model-display-engineer.md) | Model display editor — `pages/Editor/` (lights, materials, textures, post-processing) |
| [agents/animation-audio-engineer.md](agents/animation-audio-engineer.md) | 3D animations + scene audio (playback controls, crossfade, positional audio) |
| [agents/embed-engineer.md](agents/embed-engineer.md) | Embed projects, API keys, public viewer iframe |
| [agents/mantine-form-author.md](agents/mantine-form-author.md) | Mantine 9 + Zod 4 forms — registration/login/profile/upload/etc. |
| [agents/migration-author.md](agents/migration-author.md) | TypeORM migrations — generation + review |

### Read-only review / planning agents

| Agent | When |
|---|---|
| [agents/viewer-perf.md](agents/viewer-perf.md) | Diagnosing 3D viewer performance |
| [agents/meshhub-security.md](agents/meshhub-security.md) | Security review (auth, upload, embed, OWASP-style) |
| [agents/org-rbac-reviewer.md](agents/org-rbac-reviewer.md) | Org/workspace RBAC enforcement audit |
| [agents/api-contract.md](agents/api-contract.md) | Designing endpoint contracts before code |
| [agents/iter-runner.md](agents/iter-runner.md) | Reading an `ITER-<N>.md` plan, producing actionable next steps |

## Slash commands

| Command | Effect |
|---|---|
| `/db-init [--hard]` | Re-init DB schemas + run migrations + seeds |
| `/swagger` | Build server and export `swagger.openapi3.json` |
| `/update-dto [scope]` | Sync `client/src/app/api/dto.ts` against current server contracts |
| `/iter-status [N] [--dir <path>]` | Show progress on the active iteration plan. Auto-detects the plan folder; pass `--dir` to override |
| `/iter-start <N> [--dir <path>]` | Switch focus to `ITER-<N>` and produce a 3–5 item action list. Auto-detects the plan folder |
| `/quota <org>` | Print storage quota usage for an organization |
| `/files-clean [--apply]` | Audit (and optionally clean) orphaned files under `server/files/` |
| `/check-fsd` | Audit `client/src/` for FSD layer violations (upward imports) |

## Skills

### Backend / API

| Skill | When |
|---|---|
| [add-backend-feature](skills/add-backend-feature/SKILL.md) | New NestJS feature module end-to-end |
| [add-endpoint](skills/add-endpoint/SKILL.md) | One endpoint controller→service→DTO→client |
| [add-rtk-endpoint](skills/add-rtk-endpoint/SKILL.md) | Client-only — wire an existing server endpoint into RTK Query |
| [add-org-feature](skills/add-org-feature/SKILL.md) | Org/workspace-scoped feature with member-role guards |
| [add-embed-config-section](skills/add-embed-config-section/SKILL.md) | New configuration section on embed projects |

### Frontend / UI

| Skill | When |
|---|---|
| [add-widget](skills/add-widget/SKILL.md) | New FSD widget under `client/src/widgets/` |
| [tiptap-extension](skills/tiptap-extension/SKILL.md) | Adding/configuring a Tiptap extension in `WysiwygEditor` |

### 3D / viewer

| Skill | When |
|---|---|
| [add-3d-loader](skills/add-3d-loader/SKILL.md) | New file format in `Loader.ts` (FBX / OBJ / DAE / STL) |
| [add-postprocess-effect](skills/add-postprocess-effect/SKILL.md) | New EffectComposer pass in `Renderer.setPostProcessing` |
| [add-light-type](skills/add-light-type/SKILL.md) | New light variant via `LightBuilder` |
| [add-scene-object](skills/add-scene-object/SKILL.md) | New scene-object kind (audio source, helper, etc.) |
| [add-material-tab](skills/add-material-tab/SKILL.md) | Material/texture editor section in the model editor |
| [optimize-gltf](skills/optimize-gltf/SKILL.md) | Draco / KTX2 / Meshopt guidance for heavy models |
| [viewer-instrument](skills/viewer-instrument/SKILL.md) | Adding perf instrumentation hooks to the viewer |

## Note on `.github/`

`.github/agents/`, `.github/skills/`, `.github/instructions/` are GitHub Copilot artifacts and are **not auto-loaded** by Claude Code (different paths and frontmatter shape). They remain useful as references — agents/skills here cite them where relevant (e.g. [`.github/instructions/security-and-owasp.instructions.md`](../.github/instructions/security-and-owasp.instructions.md)).
