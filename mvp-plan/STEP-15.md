# STEP-15 — Scenes (Backend)

**Block:** 6 — Scene Composer
**Prerequisites:** STEP-2 (workspace entities), STEP-8 (file storage), STEP-7 (plan limits)
**Parallel with:** STEP-14 (versions)

---

## Goal

Persist and serve composed scenes: multi-model assemblies with lighting, camera bookmarks,
environment (HDRI) and per-object transforms. Enforce plan-level object/light limits.

---

## 1. Schema Constants

**`server/src/database/constants.ts`** — New:
```ts
export const SceneSchemaTables = {
  Scene: 'scene',
  SceneObject: 'scene_object',
  SceneLight: 'scene_light',
} as const;
DatabaseSchemas.Scenes = 'scenes';
```

Init SQL: `server/src/database/migrations/init/scenes.sql`
```sql
CREATE SCHEMA IF NOT EXISTS scenes;
```

---

## 2. Entity Files

**Directory:** `server/src/database/entities/scenes/`

### Types

**`scene-config.type.ts`** (plain TS, not a TypeORM entity):
```ts
export interface SceneConfig {
  backgroundColor: string;        // hex color
  ambientLightIntensity: number;
  environmentHdriPath?: string;   // relative path within scenes/<sceneId>/
  cameraBookmarks: Array<{
    label: string;
    posX: number; posY: number; posZ: number;
    targetX: number; targetY: number; targetZ: number;
  }>;
}
```

### `scene.entity.ts`

Columns:
- `name: string` (max 100)
- `description: string` (nullable, text)
- `config: SceneConfig` (jsonb column, nullable — default empty config on creation)
- `thumbnailPath: string` (nullable)

Relations:
- `@ManyToOne(() => WorkspaceEntity, { nullable: false })` → `workspace_id`
  **NOT NULL — scenes always belong to a workspace on MVP.**
- `@OneToMany(() => SceneObjectEntity)` → `objects`
- `@OneToMany(() => SceneLightEntity)` → `lights`

Extends `GuidIdEntityBase`. Table: `scene`.

### `scene-object.entity.ts`

Columns:
- `posX`, `posY`, `posZ`: float (default 0)
- `rotX`, `rotY`, `rotZ`: float (default 0) — Euler angles in radians
- `scaleX`, `scaleY`, `scaleZ`: float (default 1)
- `order: integer` (display order)

Relations:
- `@ManyToOne(() => SceneEntity, { onDelete: 'CASCADE' })` → `scene_id`
- `@ManyToOne(() => Model3dEntity)` → `model_id` (the model placed in the scene)

Extends `GuidIdEntityBase`. Table: `scene_object`.
Index on `scene_id`.

### `scene-light.entity.ts`

Columns:
- `type: enum` — `'directional' | 'point' | 'spot'`
- `posX`, `posY`, `posZ`: float
- `color: string` (hex, default `#ffffff`)
- `intensity: float` (default 1.0)
- `castShadow: boolean` (default true)

Relations: `@ManyToOne(() => SceneEntity, { onDelete: 'CASCADE' })` → `scene_id`

Extends `GuidIdEntityBase`. Table: `scene_light`.

---

## 3. Plan Limits

**`server/src/constants/plan-limits.ts`** (new file):

```ts
export const SCENE_LIMITS = {
  starter:    { maxObjects: 3,         maxLights: 2,  hdriEnabled: false },
  growth:     { maxObjects: 15,        maxLights: 10, hdriEnabled: true  },
  enterprise: { maxObjects: Infinity,  maxLights: Infinity, hdriEnabled: true },
} as const;
```

These limits are checked in `ScenesService` against `workspace.plan` (the plan field
added in STEP-7).

---

## 4. Migration

`<timestamp>-InitScenes.ts`:
- Create `scenes.scene`, `scenes.scene_object`, `scenes.scene_light`.
- Create `light_type` enum: `CREATE TYPE scenes.light_type AS ENUM ('directional', 'point', 'spot')`.

---

## 5. `scenes` Module

**Directory:** `server/src/modules/scenes/`

```
scenes/
├── scenes.module.ts
├── controllers/
│   └── scenes.controller.ts
├── services/
│   └── scenes.service.ts
├── repositories/
│   ├── scene.repository.ts
│   ├── scene-object.repository.ts
│   └── scene-light.repository.ts
├── mappers/
│   └── scene.mapper.ts
└── dto/
    ├── scene.create.request.dto.ts
    ├── scene.update.request.dto.ts
    ├── scene-object.upsert.dto.ts
    ├── scene-light.upsert.dto.ts
    └── scene.response.dto.ts
```

### Service: `ScenesService`

**`createScene(user, dto)`:**
Verify user is workspace member (role ≥ editor). Create `SceneEntity`.

**`getScene(sceneId, user)`:**
Load with relations `['objects', 'objects.model', 'lights']`.
Verify workspace membership or scene is from a public workspace (MVP: all scenes are
accessible to workspace members only).

**`listScenes(workspaceId, user)`:**
Verify membership. Return list with object count.

**`updateScene(sceneId, user, dto)`:**
Apply patches to `name`, `description`, `config` fields.

**`addObject(sceneId, user, dto)`:**
```ts
const limits = SCENE_LIMITS[workspace.plan];
const count = await this.objectRepository.countByScene(sceneId);
if (count >= limits.maxObjects) throw new ForbiddenException('Object limit reached');
```
Create `SceneObjectEntity`. Return updated scene.

**`updateObject(sceneId, objectId, user, dto)`:**
Update transform values.

**`removeObject(sceneId, objectId, user)`:**
Soft-delete.

**`addLight(sceneId, user, dto)`:**
Same plan limit check for `maxLights`.

**`updateLight(sceneId, lightId, user, dto)`:**
Update light properties.

**`removeLight(sceneId, lightId, user)`:**
Soft-delete.

**`uploadHdri(sceneId, user, file)`:**
Plan check: `if (!limits.hdriEnabled) throw new ForbiddenException(...)`.
Save file via `filesService.saveSceneHdri(sceneId, file)`.
Update `scene.config.environmentHdriPath = 'environment.hdr'`.

**`getHdriFile(sceneId)`:**
Return `StreamableFile` of `files/scenes/<sceneId>/environment.hdr`.

### `IFileStorageStrategy` Extensions

```ts
saveSceneHdri(sceneId: string, file: Express.Multer.File): Promise<void>
deleteSceneFiles(sceneId: string): Promise<void>
```

### Controller: `ScenesController`

Prefix: `/scenes`.

| Method | Route | Notes |
|---|---|---|
| POST | `/` | Create scene |
| GET | `/` | List (query `?workspaceId=`) |
| GET | `/:id` | Get scene with objects and lights |
| PATCH | `/:id` | Update scene config/name |
| DELETE | `/:id` | Soft-delete scene |
| POST | `/:id/objects` | Add model object |
| PATCH | `/:id/objects/:objId` | Update transform |
| DELETE | `/:id/objects/:objId` | Remove object |
| POST | `/:id/lights` | Add light |
| PATCH | `/:id/lights/:lightId` | Update light |
| DELETE | `/:id/lights/:lightId` | Remove light |
| POST | `/:id/hdri` | Upload HDRI (Multer, max 20 MB) |
| GET | `/:id/hdri` | Serve HDRI file (`@Public()`) |
| POST | `/:id/thumbnail` | Upload base64 screenshot |

---

## Verification

1. Starter plan: add 4th object → 403 with "Object limit reached".
2. Growth plan: HDRI upload → 200; starter plan HDRI upload → 403.
3. Scene with 2 models loads both via GET with nested object relations.
4. Concurrent `addObject` calls don't exceed limits (single transaction per add).
5. `npm run migration:run` succeeds.
