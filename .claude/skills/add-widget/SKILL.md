---
name: add-widget
description: Use when creating a new FSD widget under `client/src/widgets/`. Scaffolds the directory layout, public surface, and SCSS module per MeshHub conventions.
---

# Add a new FSD widget

Widgets are composite, reusable UI blocks under `client/src/widgets/`. They may import only from `entities/` and `shared/` — never from `pages/` or sibling widgets that don't expose a public `index.tsx`.

## Inputs

- `<WidgetName>` in PascalCase (e.g. `OrgQuotaCard`)
- Whether the widget needs local state (Redux slice → put it in `entities/`; local React state → fine inside the widget)
- Whether it has a SCSS module

## Steps

1. **Folder** `client/src/widgets/<WidgetName>/`

2. **Files**
   - `<WidgetName>.tsx` — React component, named export: `export function <WidgetName>(...)`
   - `index.tsx` — public re-export only: `export { <WidgetName> } from './<WidgetName>';` plus any types other layers need to consume.
   - `<WidgetName>.module.scss` (if styled) — classes accessed via `import styles from './<WidgetName>.module.scss'`
   - `model.ts` — local TS types if needed. **Do not** re-export `model.ts` from `index.tsx`.
   - Sub-folders for sub-components are fine; give them their own `index.tsx` only if they're a public surface.

3. **Imports**
   - From `@/entities/...` and `@/shared/...` only.
   - Mantine: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/dropzone`, `@tabler/icons-react`.
   - Never `@use` or `@import` `_mantine.scss` — auto-injected as `*` via `vite.config.ts`. Use the global `light()`/`dark()`/`hover()`/`rtl()`/`ltr()` mixins and `rem(px)` directly.

4. **UI/UX patterns**
   - Loading: `Skeleton` matching final layout, or `LoadingOverlay` for full panels.
   - Empty: reuse `widgets/EmptyData/`.
   - Errors: `notifications.show({ color: 'red', title: 'Error', message: ... })`.
   - Destructive actions: `modals.openConfirmModal()`.
   - Icon-only buttons: wrap in `<Tooltip label="...">`.
   - Float sliders: reuse `widgets/NumberInputSlider/`.

5. **Verify**
   - `cd client && npm run lint && npm run tscheck`
   - Run `npm run dev` and verify the widget renders in its consuming page. State explicitly when visual verification was skipped.

## Don't

- Don't import from `@/pages/...` or sibling widgets that don't expose a public `index.tsx`.
- Don't make the widget aware of routing (`useNavigate` is OK; URL-shape decisions belong in pages).
- Don't store widget-specific state in the global Redux store unless it's genuinely shared across widgets/pages.
