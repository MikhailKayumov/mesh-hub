# MeshHub — Current Working Plan

## Overview

This plan covers the product roadmap from foundation to full platform. Each iteration builds on the previous and produces a deployable increment.

---

## Iteration Summary

| # | Name | Status | Key Deliverable |
|---|---|---|---|
| [ITER-1](ITER-1.md) | Foundation: DB + Personal Scenes & Models | 🔲 Pending | Personal scope for models/scenes, `visibility` field, personal routes |
| [ITER-2](ITER-2.md) | Scene Editor: Complete UI | 🔲 Pending | Objects/Lights/Config panels, real-time canvas, scene state sync |
| [ITER-3](ITER-3.md) | Model Editor: Lights, Display Config & Post-Processing | 🔲 Pending | Custom lighting, renderer settings, EffectComposer pipeline, display presets |
| [ITER-4](ITER-4.md) | Model Editor: Materials & Textures | 🔲 Pending | Per-mesh material overrides, PBR sliders, texture uploads |
| [ITER-5](ITER-5.md) | Animations Enhanced + Audio | 🔲 Pending | Speed/loop/crossfade in AnimationToolbar, scene object animations, Three.js audio |
| [ITER-6](ITER-6.md) | Multi-Format Support | 🔲 Pending | FBX / OBJ+MTL / DAE / STL loader registry |
| [ITER-7](ITER-7.md) | Review & Annotations: Scenes + Access Control | 🔲 Pending | Scene annotations/comments, `@OptionalUser` access control, public scene page |
| [ITER-8](ITER-8.md) | Discovery & UX Polish | 🔲 Pending | Search, DnD upload, presets menu, measure tool, screenshot, scene clone |
| [ITER-9](ITER-9.md) | Embed & Integrations | 🔲 Pending | Scene embed, in-app notifications, webhooks, API key scopes |
| [ITER-10](ITER-10.md) | Migration Consolidation | 🔲 Pending | All migrations collapsed into one `InitAll` file before first deploy |

---

## Architecture Overview

```
PostgreSQL 18
├── auth.session
├── users.user / user_meta / role
├── model_3d.model_3d / model_3d_file / model_version
│   ├── model_material_override    ← ITER-4
│   ├── model_audio                ← ITER-5
│   └── model_annotation / model_comment (existing)
├── scenes.scene / scene_object / scene_light
│   ├── scene_annotation           ← ITER-7
│   └── scene_comment              ← ITER-7
├── organizations.organization / org_member / org_subscription
│   └── webhook / webhook_delivery_log  ← ITER-9
├── embed.api_key / embed_project
│   └── scene_id FK on embed_project   ← ITER-9
├── notifications.notification         ← ITER-9
└── workspaces.workspace / workspace_member
```

---

## Three.js Class Stack

```
Viewer
├── CameraController   — orbit, fly, FPS camera modes
├── Renderer           — WebGLRenderer + EffectComposer (ITER-3)
│   ├── SSAOPass       ← ITER-3
│   ├── UnrealBloomPass← ITER-3
│   ├── BokehPass      ← ITER-3
│   └── ColorCorrectionShader ← ITER-3
├── World              — scene graph, lights, HDRI
├── Loader             — format registry (ITER-6)
│   ├── GLTFLoader     (existing)
│   ├── FBXLoader      ← ITER-6
│   ├── OBJLoader+MTL  ← ITER-6
│   ├── ColladaLoader  ← ITER-6
│   └── STLLoader      ← ITER-6
├── MeasureTool        ← ITER-8
└── Audio              ← ITER-5 (THREE.AudioListener on camera)
```

---

## Display Presets (defined in ITER-3, exposed in ITER-8)

| Preset | Tone Mapping | Bloom | SSAO | DOF | Notes |
|---|---|---|---|---|---|
| Neutral | Reinhard | off | off | off | Raw, no effect |
| Eevee | ACESFilmic | thresh 0.9 | radius 16 | off | Blender Eevee look |
| Unreal Engine | ACESFilmic | thresh 0.8 | radius 32 | weak | UE5 defaults |
| Unity HDRP | ACESFilmic | thresh 0.85 | radius 24 | off | Unity HDRP profile |
| Product Render | Linear | off | radius 16 | off | Clean studio look |
| Studio | Linear | off | off | off | Neutral, no PP |

---

## Key Constraints (never break)

- `TypeORM synchronize: false` — migrations only
- Single RTK Query `createApi` instance — `Api.injectEndpoints` only
- FSD import direction: `app → pages → widgets → entities → shared`
- No JWT in headers — HttpOnly cookies only
- All entities use soft-delete via base class `deletedAt`
- No `process.env` in feature code — use `ConfigService`

---

## Post-MVP Items (out of scope for these iterations)

| Item | Notes |
|---|---|
| CAD formats (STEP/IGES/IFC) | Requires separate viewer mode + conversion pipeline |
| Particle systems | GPU-accelerated, complex editor needed |
| AR / WebXR full mode | Requires USDZ conversion + device testing |
| Real-time collaboration | WebSocket OT/CRDT — major infrastructure |
| AI asset generation | External API integration + credits system |
| Point clouds (PLY) | Large file handling + custom renderer |
| Alembic (ABC) | Complex animation format, low demand |
