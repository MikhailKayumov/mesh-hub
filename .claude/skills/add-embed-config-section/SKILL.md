---
name: add-embed-config-section
description: Use when adding a configuration section to embed projects (color theme, layout, behaviour, watermark, autoplay options) — extends `embed.embed_project`, settings UI, public viewer, and analytics implications.
---

# Add an embed project configuration section

Embed projects represent a configured embeddable view of a 3D model. Each org admin manages a list of projects, each with its own customisation. This skill adds a new configuration section.

Anchors:
- `server/src/database/entities/embed/embed-project.entity.ts` — entity
- `server/src/modules/embed/` — backend
- `client/src/pages/EmbedProject/EmbedProjectPage.tsx` — settings UI
- `client/src/pages/EmbedViewer/EmbedViewerPage.tsx` — public viewer that consumes config

## Steps

1. **Decide schema shape.** A new section is usually a JSON column field (`appearance: { themeColor, watermark }`) rather than a new column per setting. Group related settings into one JSON column when:
   - Settings change together (theme controls all visual)
   - Settings are optional / nullable
   - You don't need to query by them in `WHERE`

2. **Entity update** — add or extend a JSON column on `embed_project`. Type the JSON via a TypeScript interface in the entity file (`appearance: AppearanceConfig | null`).

3. **Migration** — `cd server && npm run migration:generate -- --schema=embed --name=AddEmbedProject<Section>`. JSON columns are usually `jsonb`. Default to `null` or `'{}'::jsonb` depending on whether you want to distinguish "never set" from "explicitly empty".

4. **DTOs** — request/response DTOs add the new section. Use `class-validator` `@IsObject()` + nested validation via `@ValidateNested()` + `@Type(() => SectionDto)`.

5. **Mapper + service** — mapper passes through the section. Service merges partial updates (PATCH semantics) — don't replace the whole JSON on every update; merge into existing.

6. **Settings UI** — add a section to `EmbedProjectPage.tsx`:
   - New collapsible section / accordion (match existing layout)
   - Mantine controls per setting type (`ColorInput`, `Switch`, `NumberInput`, `Select`)
   - Save via debounced PATCH or explicit Save button (match existing pattern)

7. **Public viewer wiring** — `EmbedViewerPage.tsx` reads the config (it should already be in the project response payload — verify) and applies it to the viewer. Watermark = overlay component; theme color = CSS variable; autoplay = call into viewer animation API on mount.

8. **Backwards compatibility** — for existing projects with `null` or missing fields, the viewer must render with sensible defaults. Don't crash on missing config.

9. **Verify** — create a project with the new section configured, embed it in a sample HTML page (localhost), confirm the config affects the public view.

## Don't

- Don't put each new setting in its own column — JSON column scales better.
- Don't validate the JSON only at the DB level — validate in the DTO so users get clear error messages.
- Don't break existing embeds — old projects with old config must still render.
- Don't expose internal-only settings (e.g. server-side feature flags) through the public viewer config — only config the org explicitly chose.
