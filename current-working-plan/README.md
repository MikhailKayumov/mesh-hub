# MeshHub — Current Working Plan

Full rework of the 3D platform: personal models/scenes, advanced editors, animations, multi-format support, post-processing, audio, review/collaboration.

## Iteration Index

| File | Title | Status |
|---|---|---|
| [ITER-1.md](ITER-1.md) | Foundation — DB + Personal Scenes & Models
| [ITER-2.md](ITER-2.md) | Scene Editor — Complete UI
| [ITER-3.md](ITER-3.md) | Model Editor — Lights, Display Config & Post-Processing
| [ITER-4.md](ITER-4.md) | Model Editor — Materials & Textures
| [ITER-5.md](ITER-5.md) | Animations Enhanced + Audio
| [ITER-6.md](ITER-6.md) | Multi-Format Support (FBX / OBJ / DAE / STL)
| [ITER-7.md](ITER-7.md) | Review & Annotations — Scenes + Access Control
| [ITER-8.md](ITER-8.md) | Discovery & UX Polish — Search, Presets, Tools
| [ITER-9.md](ITER-9.md) | Embed & Integrations — Notifications, AR, Webhooks
| [ITER-10.md](ITER-10.md) | Migration Consolidation — Single InitAll File

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

Moved to [client/AGENTS.md § UI/UX Conventions](../client/AGENTS.md#uiux-conventions) — these apply project-wide and live with the persistent client docs, not the transient plan.

## Post-MVP

- CAD viewer (STEP / IGES / IFC) — different display paradigm, no scene support
- Particle / VFX emitter system
- WebXR / AR viewer
