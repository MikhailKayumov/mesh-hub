---
name: add-postprocess-effect
description: Use when adding a new EffectComposer post-processing pass (Bloom, SSAO, DOF, Vignette, ColorCorrection, FXAA, custom ShaderPass) to the MeshHub viewer's `Renderer.setPostProcessing` pipeline. Wires the config through `PostProcessConfig`, the model display config UI, and ensures pass order/disposal is correct.
---

# Add a new post-processing effect

Target file: [client/src/widgets/Model3DViewer/classes/Renderer/Renderer.ts](../../../client/src/widgets/Model3DViewer/classes/Renderer/Renderer.ts). The pipeline is `RenderPass` → [optional passes] → `OutputPass`, configured through `Renderer.setPostProcessing(config: PostProcessConfig)`.

## Inputs

- Effect name (e.g. `fxaa`, `chromaticAberration`)
- Three.js pass class + import path (e.g. `FXAAShader` from `three/examples/jsm/shaders/FXAAShader.js`, wrapped in `ShaderPass`)
- Per-pass config fields and their defaults
- Where in the pipeline order it must sit (most antialiasing-style passes go near the end, before `OutputPass`)

## Steps

1. **Extend `PostProcessConfig`** (in `widgets/Model3DViewer/classes/types/`) with the new effect's config block:
   ```ts
   <effectName>?: { enabled: boolean; <fieldA>?: number; <fieldB>?: number };
   ```
   Mark it optional and put `enabled: boolean` first. All numeric params optional with reasonable defaults.

2. **Add the pass branch** in `Renderer.setPostProcessing`:
   - Use `await import('three/examples/jsm/postprocessing/...')` for lazy loading (matches existing branches; keeps initial bundle small).
   - Read fields with `??` defaults — every existing branch follows this idiom. Use the same defaults as Three.js examples unless the design dictates otherwise.
   - Insert in the correct order. Current order: SSAO → Bloom → DOF → Vignette → ColorCorrection → OutputPass. Document the new pass's position in a comment if it must sit elsewhere.

3. **Disposal.** `setPostProcessing` already drops all passes except index 0 (`RenderPass`) before re-adding. If the new pass holds GPU resources beyond what's owned by the standard `Pass` lifecycle (custom render targets, allocated textures), add explicit cleanup — either in a `dispose()` helper called when popping, or in `Renderer.destroy`.

4. **Resize.** `Renderer.resize` calls `composer.setSize(w, h)` — that propagates to passes that implement `setSize`. If your pass needs a fixed-size render target (like `UnrealBloomPass` does at `(512, 512)`), set it inside the branch and don't rely on resize.

5. **Model display config (if exposing in the UI)** —
   - Add the new effect's fields to the model's `display_config` shape on the server (entity column type, migration).
   - Hook up the editor tab in `pages/Editor/` (verify the post-processing tab exists; if not, leave a TODO marker and surface it to the user).
   - Persist via the appropriate `models-3d` mutation; `Renderer.setPostProcessing` is invoked on config change.

6. **Defaults** — pick values that look correct on the in-repo `test-models/` samples. Don't enable the effect by default unless the user opts in; new effects start `enabled: false`.

7. **Verify**
   - `cd client && npm run lint && npm run tscheck`
   - `npm run dev` — load a sample model, toggle the effect, confirm it visibly applies and that disabling rebuilds the pipeline cleanly without WebGL errors in console.
   - Watch for shader-compile stutter the first time the pass loads (lazy import). Document in PR if noticeable.

## Don't

- Don't skip the lazy `await import(...)` — passes are heavy; static-importing them all bloats the initial bundle.
- Don't insert the pass after `OutputPass` — `setPostProcessing` always re-adds `OutputPass` last; ensure your branch runs before that line.
- Don't mutate `composer.passes` directly outside `setPostProcessing` — the rebuild logic depends on a known pre-state.
- Don't leave per-frame allocations in custom shader passes (`new Vector2()` inside `render` is a smell).
