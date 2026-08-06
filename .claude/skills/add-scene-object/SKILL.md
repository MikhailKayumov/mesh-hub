---
name: add-scene-object
description: Use when adding a new kind of scene object to the MeshHub scene editor — beyond model references and lights (e.g. audio source, helper, decorator, particle emitter). Walks the entity → migration → DTO → service → mapper → RTK Query → UI panel chain.
---

# Add a new scene-object kind

Existing object kinds live in `scenes.scene_object` (model references) and `scenes.scene_light` (lights). Adding a new kind (audio source, marker, helper, etc.) requires a parallel table or a discriminator column on `scene_object`.

## Decision: new table vs discriminator

- **New table** — when the new object kind has a meaningfully different schema (audio: file ref, gain, loop, positional flag). Mirror the `scene_light` pattern: own table, FK to `scene`, owned by mapper.
- **Discriminator column on `scene_object`** — when the new kind is structurally similar to existing ones. Risk: makes nullable columns proliferate. Prefer the new-table option unless the kinds genuinely share fields.

## Steps (new-table case)

1. **Entity** — `server/src/database/entities/scenes/scene-<kind>.entity.ts`. Extend `GuidIdEntityBase`. Add FK to `SceneEntity` (`onDelete: 'CASCADE'`). Add fields and Mantine-friendly defaults.
2. **Constants** — add table name to `server/src/database/constants.ts` under the `scenes` schema group.
3. **Migration** — `cd server && npm run migration:generate -- --schema=scenes --name=AddScene<Kind>`. Strip noise.
4. **Module wiring** — register the new entity in `server/src/modules/scenes/scenes.module.ts` `TypeOrmModule.forFeature([...])`.
5. **DTOs** — `server/src/modules/scenes/dto/scene-<kind>.{request,response,update.request}.dto.ts`.
6. **Repository + service + mapper** — extend the scenes module's existing repository pattern. The mapper converts entity ↔ DTO.
7. **Controller endpoints** — typically `POST /scenes/:sceneId/<kind>s`, `GET`, `PATCH /:id`, `DELETE /:id`. Reuse pagination decorators if listing.
8. **Auth** — every endpoint requires workspace membership for the parent scene. Verify in service.
9. **Swagger** — `cd server && npm run swagger:generate`.
10. **Client DTO** — update `client/src/app/api/dto.ts`.
11. **RTK Query** — add endpoints to `client/src/app/api/scenes.ts`. Set `providesTags: ['Scene']` on writes (pessimistic) — list reload is acceptable for low-cardinality kinds.
12. **UI panel** — new `SceneEditor/panels/Scene<Kind>Panel.tsx`. Wire into `SceneEditorPage`'s panel tab list. Form via `mantine-form-author` patterns.
13. **Viewer integration** — if the new kind affects rendering (audio source = `THREE.PositionalAudio`, helper = visual gizmo), extend `useSceneViewer` and add a builder under `widgets/Model3DViewer/classes/` if the logic is non-trivial.
14. **Verify** — `lint && tscheck` on both sides; manually create/edit/delete the new kind in the editor and confirm persistence.

## Don't

- Don't add the new kind's fields to `scene_object` if a separate table is the right call.
- Don't bypass the mapper — Mantine forms will eventually need the DTO shape.
- Don't forget `onDelete: 'CASCADE'` from `scene` — orphaned rows are a maintenance trap.
