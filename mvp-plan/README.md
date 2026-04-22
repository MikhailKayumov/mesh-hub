# MeshHub MVP — Implementation Plan

Full-stack B2B platform built on top of the existing MeshHub codebase.
All blocks build on the existing Auth, User, Model3D, Viewer, FilesService foundation.

## Critical Pre-Conditions (STEP-0)

Before any MVP block, fix two production bugs + one security issue in the existing code:

1. **FS path bug** — file directories are keyed by `fileEntityId`, should be `modelId`.
2. **Migration bug** — `isVisible` column was created as camelCase, breaking snake_case strategy.
3. **Path traversal** — `GET /models-3d/files/:fileId/:fileName` uses `join()` without sanitization.

## Block Overview

| Block | Steps | Description | Depends on |
|---|---|---|---|
| 0 — Pre-MVP Fixes | STEP-0 | Critical bug + security fixes | — |
| 1 — Orgs & Workspaces | STEP-1, 2, 3, 4 | B2B multi-tenant foundation | STEP-0 |
| 1.5 — ZIP Support | STEP-5, 6 | Multi-file 3D model uploads | STEP-0 |
| 2 — Quotas & S3 | STEP-7, 8 | Storage limits + pluggable S3 backend | STEP-1–3 |
| 3 — Embed Viewer | STEP-9, 10, 11 | iframe embed with API keys | STEP-1–3 |
| 4 — Reviews | STEP-12, 13 | 3D annotations + comments | STEP-1–3 |
| 5 — Versions | STEP-14 | Model file history | STEP-0 |
| 6 — Scenes | STEP-15, 16 | Multi-model compositions | STEP-1–3, 7 |

## File Map

| File | Purpose |
|---|---|
| `README.md` | This file — overview and navigation |
| `SUMMARY.md` | Live status table, updated after each step |
| `STEP-0.md` | Pre-MVP: FS path fix, migration fix, security |
| `STEP-1.md` | Block 1: DB entities (Orgs, Workspaces) |
| `STEP-2.md` | Block 1: Organizations module (backend) |
| `STEP-3.md` | Block 1: Workspaces module (backend) |
| `STEP-4.md` | Block 1: Frontend (RTK Query, Redux, pages, widgets) |
| `STEP-5.md` | Block 1.5: ZIP/multi-file support (backend) |
| `STEP-6.md` | Block 1.5: ZIP/multi-file support (frontend) |
| `STEP-7.md` | Block 2: StorageQuotaModule + OrgSubscription |
| `STEP-8.md` | Block 2: S3 file storage strategy |
| `STEP-9.md` | Block 3: API keys + embed entities (backend) |
| `STEP-10.md` | Block 3: Embed module (backend) |
| `STEP-11.md` | Block 3: Embed frontend (EmbedViewer, EmbedProject) |
| `STEP-12.md` | Block 4: Reviews + Annotations (backend) |
| `STEP-13.md` | Block 4: Reviews frontend + Viewer.ts extensions |
| `STEP-14.md` | Block 5: Versions (backend + frontend) |
| `STEP-15.md` | Block 6: Scenes (backend) |
| `STEP-16.md` | Block 6: Scenes (frontend) |

## Conventions

- All backend code follows existing patterns: Repository + Mapper + Service + Controller + DTOs.
- Frontend follows FSD: `app → pages → widgets → entities → shared`.
- Never use `synchronize: true` — all schema changes via TypeORM migrations.
- All new RTK Query endpoints use `Api.injectEndpoints({ overrideExisting: true })`.
- All new entities extend `GuidIdEntityBase` (UUID PK) or `IntIdBaseEntity` (serial PK).
- Schema/table name constants live in `server/src/database/constants.ts`.
