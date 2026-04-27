# MeshHub — Current Working Plan

Full rework of the 3D platform: personal models/scenes, advanced editors, animations, multi-format support, post-processing, audio, review/collaboration.

## Iteration Index

| File | Title | Status |
|---|---|---|
| [ITER-1.md](ITER-1.md) | Foundation — DB + Personal Scenes & Models | 🔲 Pending |
| [ITER-2.md](ITER-2.md) | Scene Editor — Complete UI | 🔲 Pending |
| [ITER-3.md](ITER-3.md) | Model Editor — Lights, Display Config & Post-Processing | 🔲 Pending |
| [ITER-4.md](ITER-4.md) | Model Editor — Materials & Textures | 🔲 Pending |
| [ITER-5.md](ITER-5.md) | Animations Enhanced + Audio | 🔲 Pending |
| [ITER-6.md](ITER-6.md) | Multi-Format Support (FBX / OBJ / DAE / STL) | 🔲 Pending |
| [ITER-7.md](ITER-7.md) | Review & Annotations — Scenes + Access Control | 🔲 Pending |
| [ITER-8.md](ITER-8.md) | Discovery & UX Polish — Search, Presets, Tools | 🔲 Pending |
| [ITER-9.md](ITER-9.md) | Embed & Integrations — Notifications, AR, Webhooks | 🔲 Pending |

## Architecture Pillars

1. **Models** — personal + workspace; public catalog
2. **Scenes** — personal + workspace; objects, lights, config
3. **Model Display Editor** — per-model lighting, materials, post-processing
4. **Scene Editor** — object placement, lights, HDRI, animations, audio
5. **Review** — 3D annotations + comments on models and scenes

## Key Tech Decisions

- `scenes.scene.workspace_id` → nullable; add `user_id` FK; `visibility` enum
- `Renderer.ts` → switch to `EffectComposer` pipeline (SSAO, Bloom, DOF, Vignette)
- `Loader.ts` → loader registry keyed by file extension
- `AnimationToolbar` → extend with speed, loop mode, crossfade; scene animation support
- CAD formats (STEP/IGES/IFC) — **post-MVP**, separate viewer mode

## Cross-Cutting UI/UX Conventions

Apply to **all** pages and panels across every iteration. Follow these without exception:

| Pattern | Mantine Component | When |
|---|---|---|
| Empty lists / grids | `EmptyData` widget (existing in `widgets/EmptyData/`) | When query returns 0 items |
| Loading cards / lists | `Skeleton` (same grid/list structure as data) | While `isLoading=true` |
| Full-page / panel loading | `LoadingOverlay` | Initial page load or in-flight uploads |
| Destructive actions | `modals.openConfirmModal()` | Delete, reset, revoke |
| Mutation errors | `notifications.show({ color: 'red', title: 'Error', message: ... })` | All RTK mutation failures |
| Icon-only buttons | Wrapped in `<Tooltip label="...">` | Every `ActionIcon` without visible text |
| Color pickers | `ColorInput` (Mantine) | All hex color fields |
| Float value sliders | `NumberInputSlider` widget (existing in `widgets/NumberInputSlider/`) | Combined slider + number input |
| Unsaved state indicator | Dirty `Badge` / `dot` on tab icon + `loading={isSaving}` on Save button | Forms with pending DB changes |
| Tab navigation (editors) | Icon-only `Tabs` with `Tooltip`, using `TabValues` const + `getTabsConfig()` helper | Both Model Editor and Scene Editor navbars |

## Post-MVP

- CAD viewer (STEP / IGES / IFC) — different display paradigm, no scene support
- Particle / VFX emitter system
- WebXR / AR viewer
