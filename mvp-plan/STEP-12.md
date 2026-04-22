# STEP-12 — Reviews & Annotations (Backend)

**Block:** 4 — Review Tools
**Prerequisites:** STEP-2/3 (workspace membership for access control)
**Parallel with:** STEP-10/11 (embed) and STEP-14 (versions)

---

## Goal

Implement 3D comments (reviews) and editor annotations: DB entities, migrations,
and full CRUD endpoints with workspace-level access control.

---

## 1. New Schema Constants

**`server/src/database/constants.ts`** — Add to `Models3DSchemaTables`:
```ts
ModelComment: 'model_comment',
ModelAnnotation: 'model_annotation',
```

Comments and annotations live in the `model_3d` schema to stay close to the model data.

---

## 2. Entity Files

**Directory:** `server/src/database/entities/models-3d/`

### `model-comment.entity.ts`

Columns:
- `body: string` (text)
- `posX: number` (float, nullable — null means not anchored to a position)
- `posY: number` (float, nullable)
- `posZ: number` (float, nullable)
- `resolved: boolean` (default false)
- `parentId: string` (UUID, nullable — self-referential for replies)

Relations:
- `@ManyToOne(() => Model3dEntity)` → `model_id`
- `@ManyToOne(() => UserEntity)` → `author_id`
- `@ManyToOne(() => ModelCommentEntity, { nullable: true })` → `parent_id` (self-ref)

Extends `GuidIdEntityBase`. Table: `model_comment`.
Add index on `model_id` for fast per-model loading.

### `model-annotation.entity.ts`

Columns:
- `label: string` (text, max 50 chars)
- `body: string` (text, nullable — detailed description)
- `posX: number` (float)
- `posY: number` (float)
- `posZ: number` (float)
- `cameraPosX: number` (float, nullable — camera position when annotation was created)
- `cameraPosY: number` (float, nullable)
- `cameraPosZ: number` (float, nullable)
- `order: integer` (default 0 — display order in annotation list)

Relations: `@ManyToOne(() => Model3dEntity)` → `model_id`

Extends `GuidIdEntityBase`. Table: `model_annotation`.
Add index on `model_id`.

---

## 3. Migration

`server/src/database/migrations/models-3d/<timestamp>-AddReviewsAndAnnotations.ts`

Creates both tables + indexes + self-referential FK for `model_comment.parent_id`.

---

## 4. `reviews` Module

**Directory:** `server/src/modules/reviews/`

```
reviews/
├── reviews.module.ts
├── controllers/
│   └── reviews.controller.ts
├── services/
│   └── reviews.service.ts
├── repositories/
│   └── model-comment.repository.ts
├── mappers/
│   └── comment.mapper.ts
└── dto/
    ├── comment.create.request.dto.ts
    ├── comment.update.request.dto.ts
    └── comment.response.dto.ts
```

### DTOs

**`comment.create.request.dto.ts`:**
`body: string` (@IsNotEmpty, @MaxLength(2000)),
`posX?: number`, `posY?: number`, `posZ?: number` (@IsOptional, @IsNumber each),
`parentId?: string` (@IsOptional, @IsUUID).

**`comment.update.request.dto.ts`:**
`body?: string`, `resolved?: boolean` (@IsOptional, @IsBoolean).

**`comment.response.dto.ts`:**
`id`, `body`, `pos: { x, y, z } | null`, `resolved`, `parentId | null`,
`author: { id, firstName, lastName, avatar }`, `createdAt`, `updatedAt`.

### Service: `ReviewsService`

**`getComments(modelId, user?)`:**
Load all comments for the model. Anyone who can view the model can see comments
(public model → public comments). No pagination on MVP (typically <100 per model).
Return flat list — frontend groups into threads by `parentId`.

**`addComment(modelId, user, dto)`:**
Verify model exists and user can access it (workspace member or model is public).
Create `ModelCommentEntity`. Return created DTO.

**`updateComment(modelId, commentId, user, dto)`:**
Verify ownership: `comment.authorId === user.id` OR user is workspace admin.
If `dto.body` provided → edit body (add `updatedAt` is automatic).
If `dto.resolved` provided → toggle resolved.

**`deleteComment(modelId, commentId, user)`:**
Same ownership rule. Soft-delete. If comment has replies, soft-delete all replies too
(query children by `parentId`).

### Controller: `ReviewsController`

Prefix: `/models-3d/:modelId/comments`.

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/` | `@Public()` (with optional auth) | `@OptionalUser()` decorator |
| POST | `/` | `@Roles([User])` | |
| PATCH | `/:commentId` | `@Roles([User])` | |
| DELETE | `/:commentId` | `@Roles([User])` | |

---

## 5. `annotations` Module

**Directory:** `server/src/modules/annotations/`

```
annotations/
├── annotations.module.ts
├── controllers/
│   └── annotations.controller.ts
├── services/
│   └── annotations.service.ts
├── repositories/
│   └── model-annotation.repository.ts
└── dto/
    ├── annotation.create.request.dto.ts
    ├── annotation.update.request.dto.ts
    └── annotation.response.dto.ts
```

### DTOs

**`annotation.create.request.dto.ts`:**
`label: string` (@MaxLength(50)), `body?: string`, `posX/Y/Z: number`, `cameraPosX/Y/Z?: number`, `order?: number`.

**`annotation.update.request.dto.ts`:** All fields optional.

### Service: `AnnotationsService`

**`getAnnotations(modelId)`** — `@Public()` eligible (for embed viewer).
Return ordered by `order ASC, createdAt ASC`.

**`createAnnotation(modelId, user, dto)`:**
Verify user is workspace member with role ≥ `editor`.

**`updateAnnotation(modelId, annotationId, user, dto)`:**
Same role check.

**`deleteAnnotation(modelId, annotationId, user)`:**
Same role check. Soft-delete.

**`reorderAnnotations(modelId, user, ids: string[])`:**
Accept ordered array of annotation IDs; update `order` field on each.

### Controller: `AnnotationsController`

Prefix: `/models-3d/:modelId/annotations`.

| Method | Route | Auth |
|---|---|---|
| GET | `/` | `@Public()` |
| POST | `/` | `@Roles([User])` |
| PATCH | `/:id` | `@Roles([User])` |
| DELETE | `/:id` | `@Roles([User])` |
| PUT | `/reorder` | `@Roles([User])` |

---

## Module Registration

Import both `ReviewsModule` and `AnnotationsModule` in `app.module.ts`.

---

## Verification

1. `POST /api/models-3d/:id/comments` → 201; appears in `GET` response.
2. Resolve a comment (`{ resolved: true }`) → appears resolved in GET.
3. Non-author cannot edit/delete → 403.
4. Delete comment with replies → replies also soft-deleted.
5. `GET /api/models-3d/:id/annotations` without auth → 200 (public).
6. `POST` annotation without workspace membership → 403.
