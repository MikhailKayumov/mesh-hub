---
name: add-material-tab
description: Use when adding a section/tab to the model editor that edits materials and textures — wires controls into `pages/Editor/`, applies via the GLTF material API, and persists in the model's display config.
---

# Add a material/texture editor section

The model editor lets users tweak materials of the loaded GLTF and persist those tweaks per-model.

Anchors:
- `client/src/pages/Editor/components/Forms/` and `Fields/` — form controls
- `client/src/pages/Editor/hooks/useEditor.ts` — editor state hook
- `client/src/widgets/Model3DViewer/classes/World/` — scene where materials live (after GLTF load)
- `server/src/database/entities/models-3d/model-3d.entity.ts` — has or will have a `display_config` JSON column

## Conceptual model

GLTF loads materials as `MeshStandardMaterial` (or similar). The editor lets users select a mesh, tweak its material's properties (color, metalness, roughness, normal map intensity, emissive), and persist those tweaks. On reload, the viewer re-applies the persisted overrides to the freshly loaded GLTF materials.

Persistence shape (suggested):
```ts
display_config.materialOverrides: {
  [materialName: string]: {
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    map?: { textureId: string };
    // ...
  }
}
```

Reapplication: on load, traverse the GLTF scene, match materials by name, apply overrides.

## Steps

1. **Tab integration** — add the material tab to the editor's tab list (matches existing icon-only `Tabs` pattern). Use `TabValues` const.
2. **Mesh / material picker** — list materials present in the loaded GLTF (sourced from `parser.associations` returned by the loader). Selecting one focuses the editor on that material's overrides.
3. **Property controls** — Mantine controls:
   - `ColorInput` for `color`, `emissive`
   - `widgets/NumberInputSlider/` for scalar params (metalness 0–1, roughness 0–1, emissive intensity 0–10)
   - File input for textures (uploads via existing storage strategy under `models-3d/<modelId>/textures/<...>`)
4. **Live preview.** Apply changes to the live `MeshStandardMaterial` on every control change (no debounce) — users expect instant feedback. Set `material.needsUpdate = true` when changing maps.
5. **Persistence.** On save, mutate `display_config` via the existing `models-3d` PATCH endpoint. Don't write per-keystroke; trigger save on user action (Save button, blur of last field).
6. **Texture uploads.** New endpoint or reuse a generic file-attach endpoint? Verify `models-3d` module — if no texture endpoint, add one (see `add-endpoint` skill).
7. **Reapplication on load.** Hook into `useViewer` post-load callback: after `Loader.load` resolves and the scene is mounted, walk materials and apply overrides.
8. **Verify.** Load a model with multiple materials, change one, save, reload, confirm override persisted and re-applied. Check that textures upload, render, and don't leak GPU memory on navigate-away.

## Don't

- Don't replace `MeshStandardMaterial` with a different class — keep the GLTF-native material and tweak properties.
- Don't deep-clone materials before tweaking unless multiple meshes share the same material instance and the user wants per-mesh override (then yes, clone first).
- Don't store the entire texture binary in `display_config` — store a reference (file ID) and serve via the file endpoint.
