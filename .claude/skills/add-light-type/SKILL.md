---
name: add-light-type
description: Use when adding a new light variant (e.g. RectAreaLight, HemisphereLight) to the MeshHub viewer's `LightBuilder` and the scene/model editors. Wires the light through `LightBuilder`, the `scene_light` entity, the editor UI, and serialization.
---

# Add a new light type

Anchors:
- `client/src/widgets/Model3DViewer/classes/Lights/LightBuilder.ts` — light factory
- `client/src/widgets/Model3DViewer/classes/Lights/types.ts` — light config shape
- `server/src/database/entities/scenes/scene-light.entity.ts` — server-side persisted light
- `client/src/pages/SceneEditor/panels/SceneLightsPanel.tsx` — UI

Three.js light types in scope: `DirectionalLight`, `PointLight`, `SpotLight`, `AmbientLight`, `HemisphereLight`, `RectAreaLight` (requires `RectAreaLightUniformsLib.init()` on Renderer init).

## Steps

1. **Type definition** — extend the light-type union in `Lights/types.ts` with the new kind. Add its config fields (color, intensity, plus type-specific: `width/height` for rect-area, `angle/penumbra` for spot, `groundColor` for hemisphere, `decay/distance` for point).
2. **`LightBuilder` branch** — add a constructor branch in `LightBuilder` that creates the Three.js light instance and applies position / target / color / intensity / type-specific params. Match existing branches' style.
3. **Renderer init (if RectAreaLight)** — call `RectAreaLightUniformsLib.init()` once during `Viewer` setup. Don't import it lazily — the lib is small and must be ready before any rect-area light renders.
4. **Persistence** — extend `scenes.scene_light` entity to store the new fields. Add migration. Update server-side mapper + DTOs.
5. **Editor UI** — extend `SceneLightsPanel.tsx`:
   - Add the new type to the type-select dropdown
   - Conditionally render type-specific controls based on selected type
   - Use `widgets/NumberInputSlider/` for numeric params, `ColorInput` for colors, `widgets/NumberInputSlider/` (or two of them) for vector params
6. **Per-model lights (model display)** — if model-level light setups apply, extend the corresponding model `display_config` schema and wire into the model editor lights tab.
7. **Default values** — pick defaults that produce a visible, sane light when first added (avoid intensity 0 / black color).
8. **Verify** — `lint && tscheck`. In the scene editor: add a light of the new type, tweak params, save, reload, confirm round-trip and visible effect.

## Don't

- Don't instantiate the new light type outside `LightBuilder` — keeps construction in one place.
- Don't skip migration; type-specific fields like `width/height` won't fit existing columns.
- Don't forget `LightBuilder.dispose` — lights are cheap, but removed lights still reference scene nodes; clean up.
