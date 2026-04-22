# MeshHub MVP — Implementation Summary

> **Update this file after completing each step.**
> Status: `TODO` → `IN PROGRESS` → `DONE`

## Progress

| Step | Block | Title | Status | Notes |
|---|---|---|---|---|
| STEP-0 | Pre-MVP | Critical Fixes (FS, Migration, Security) | DONE | |
| STEP-1 | 1 | DB Entities — Orgs & Workspaces | TODO | |
| STEP-2 | 1 | Organizations Module Backend | TODO | |
| STEP-3 | 1 | Workspaces Module Backend | TODO | |
| STEP-4 | 1 | Frontend — Orgs/Workspaces | TODO | |
| STEP-5 | 1.5 | ZIP Support Backend | TODO | |
| STEP-6 | 1.5 | ZIP Support Frontend | TODO | |
| STEP-7 | 2 | StorageQuota + OrgSubscription | TODO | |
| STEP-8 | 2 | S3 File Strategy | TODO | |
| STEP-9 | 3 | API Keys + Embed Entities | TODO | |
| STEP-10 | 3 | Embed Module Backend | TODO | |
| STEP-11 | 3 | Embed Frontend | TODO | |
| STEP-12 | 4 | Reviews + Annotations Backend | TODO | |
| STEP-13 | 4 | Reviews Frontend + Viewer Extensions | TODO | |
| STEP-14 | 5 | Versions (Full Stack) | TODO | |
| STEP-15 | 6 | Scenes Backend | TODO | |
| STEP-16 | 6 | Scenes Frontend | TODO | |

## Completed Steps Log

| Step | Date | Notes |
|---|---|---|
| STEP-0 | 2026-04-22 | All three fixes applied — FS path, visibility migration, path traversal |

## Known Issues / Decisions Made

| Date | Decision |
|---|---|
| 2026-04-22 | FS directories keyed by `modelId`, not `fileEntityId` (see STEP-0) |
| 2026-04-22 | `SceneEntity.workspaceId` is NOT NULL — no personal scenes on MVP |
| 2026-04-22 | `WorkspaceMember.role` enum: `editor \| viewer` (owner/admin only at org level) |
| 2026-04-22 | `EmbedProject` has no FK to `ApiKey` — any org key authorizes embed requests |
| 2026-04-22 | `StorageQuotaModule` is a standalone module imported by both Orgs and Models3d |
| 2026-04-22 | Embed iframe postMessage validates `event.origin` against domain whitelist |


## STEP-0 SUMMARY

### Fix 1 — FS path uses `modelId` (not `fileEntityId`)
- **model-3d.service.ts**: Reordered `upload3DModel()` — file entity + model entity are both saved to DB first, then `filesService.save3DModel(savedModel.id, file)` uses `model.id`; cleanup tracking changed from `savedFileId` → `savedModelId`
- `delete3DModel()` and `save3DModelThumbnailFromBase64()` changed to pass `model.id` instead of `model.file.id`
- **Client** — `getModel3DFileSrc`/`getThumbnailSrc` parameter renamed to `modelId`; all 4 call sites updated to pass `model.id` instead of `model.file.id`

### Fix 2 — `visibility` enum replaces broken `"isVisible"` column
- New `ModelVisibility` enum (`public | private | unlisted`) in models-3d.ts
- `Model3dEntity`: `isVisible: boolean` → `visibility: ModelVisibility`
- New migration 1745280000000-FixVisibilityColumnAndAddEnum.ts — creates the `model_visibility` enum type, adds `visibility` column, migrates data from the old camelCase column, then drops it
- Updated model-3d.response.dto.ts, model-3d.update.request.dto.ts, model-3d.mapper.ts, service filter, and client dto.ts/new_dto.ts/`EditPropertiesDrawer/constants.ts`

### Fix 3 — Path traversal in file serving
- Replaced `join()` with `resolve()` + a `safeResolvePath()` private method that throws `ForbiddenException` if the resolved path escapes the per-model base directory
- Both endpoints renamed `:fileId` → `:modelId` and now use `ParseUUIDPipe` to additionally block UUID-shaped traversal
