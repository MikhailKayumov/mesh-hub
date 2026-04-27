# ITER-8 — Discovery & UX Polish

## Goal

Search across models and scenes, drag-and-drop upload, viewport measurement tool, mesh statistics, screenshot export, scene cloning, display presets (Eevee/Unreal/HDRP), and quick access dashboard.

## Status: 🔲 Pending

---

## Features

### 1. Search UI

**Backend**: `GET /models-3d?search=X` already supports search param. `GET /scenes?search=X` — add search to `ScenesService.listScenes()`.

**Frontend**:
- `SearchInput` in `Header` widget (desktop only, `visibleFrom="md"`)
- Debounced 300ms → triggers both queries
- **Results dropdown** — use Mantine `Combobox` component:
  ```tsx
  <Combobox store={combobox} onOptionSubmit={handleSelect}>
    <Combobox.Target>
      <TextInput placeholder="Search models & scenes..." value={query} onChange={...} />
    </Combobox.Target>
    <Combobox.Dropdown>
      <Combobox.Group label="Models">
        {models.map(m => (
          <Combobox.Option key={m.id} value={`model:${m.id}`}>
            <Group gap="xs">
              <Image src={m.thumbnailUrl} w={20} h={20} radius={2} />
              <Text size="sm">{m.title}</Text>
              <Badge size="xs">{m.format}</Badge>
            </Group>
          </Combobox.Option>
        ))}
      </Combobox.Group>
      <Combobox.Group label="Scenes">
        {scenes.map(s => (
          <Combobox.Option key={s.id} value={`scene:${s.id}`}>
            <Group gap="xs">
              <Image src={s.thumbnailUrl} w={20} h={20} radius={2} />
              <Text size="sm">{s.name}</Text>
              <Badge size="xs" color="teal">Scene</Badge>
            </Group>
          </Combobox.Option>
        ))}
      </Combobox.Group>
      {!models.length && !scenes.length && <Combobox.Empty>No results found</Combobox.Empty>}
    </Combobox.Dropdown>
  </Combobox>
  ```
- `combobox.resetSelectedOption()` on input clear
- Click option → navigate to model/scene page

### 2. Drag-and-Drop Upload

File: `client/src/pages/UserModels3D/` (personal models page)

- `useDropzone` listener on `document.body` when page is active
- Drop `.glb` / `.fbx` / `.obj` / `.dae` / `.stl` / `.zip` → open `UploadModelModal` with file pre-filled
- **Drop overlay** (full-page animated):
  ```tsx
  <Transition mounted={isDragging} transition="fade" duration={150}>
    {(styles) => (
      <Overlay style={{ ...styles, border: '2px dashed var(--mantine-primary-color-filled)' }}
        backgroundOpacity={0.6} zIndex={200}>
        <Center h="100%">
          <Stack align="center" gap="sm">
            <IconUpload size={48} color="var(--mantine-primary-color-filled)" />
            <Text fw={600} size="xl">Drop to upload</Text>
          </Stack>
        </Center>
      </Overlay>
    )}
  </Transition>
  ```
- `isDragging` set via `document.body` `dragenter`/`dragleave` listeners (track enter count to handle child element crossing)
- Also: DnD zone on the "Upload" button area

### 3. Screenshot Export

Add "📷 Save Screenshot" button to:
- Model3DViewer toolbar (bottom bar)
- Scene Editor top bar (beside existing "Capture Thumbnail")

Action: `renderer.domElement.toBlob('image/png')` → `URL.createObjectURL()` → trigger download

Optional watermark for public models: canvas `drawText(modelName + site)` before download.

### 4. Measurement Tool

Mode: `viewer.setMode('measure')`

File: `client/src/widgets/Model3DViewer/classes/` — new `MeasureTool.ts`

- Click 1 → record point A (world space from raycaster)
- Click 2 → record point B → compute `A.distanceTo(B)` → display label
- Visual: `Line2` between A and B + `CSS2DObject` label showing distance in meters
- Toolbar button to toggle measure mode; ESC cancels
- Clears on mode change

### 5. Mesh Statistics

Location: Scene tab in Model Editor (`client/src/pages/Editor/panels/tabs/SceneTab.tsx`)

Extract from `viewer.world.scene.traverse()`:

```ts
{
  meshCount: number,
  totalVertices: number,
  totalFaces: number,        // position.count / 3
  materialCount: number,     // unique materials
  textureCount: number,      // unique textures
  boundingBoxSize: Vector3,  // in meters
}
```

Display as `SimpleGrid cols={2}` of mini stat cards:
```tsx
{[
  { label: 'Meshes', value: stats.meshCount },
  { label: 'Vertices', value: stats.totalVertices.toLocaleString() },
  { label: 'Faces', value: stats.totalFaces.toLocaleString() },
  { label: 'Materials', value: stats.materialCount },
].map(({ label, value }) => (
  <Paper key={label} p="xs" withBorder>
    <Text size="xs" c="dimmed">{label}</Text>
    <Text fw={700} size="sm">{value}</Text>
  </Paper>
))}
```

### 6. Scene Clone

**Backend**: `POST /scenes/:id/clone`
- Deep copy: scene → objects → lights → config
- New name: `{original.name} (copy)`
- Returns new `SceneListItemResponseDto`

**Frontend**:
- "Duplicate" ActionIcon on scene card in `ScenesPage` (three-dot menu or direct icon)
- On success: navigate to new scene card (highlight it briefly)

### 7. Display Presets in Viewer Toolbar

File: `client/src/widgets/Model3DViewer/components/Model3DViewerBottomBar/` or top bar

- "Preset" button → `Menu` dropdown listing presets:
  - Neutral / Eevee / Unreal Engine / Unity HDRP / Product / Studio
  - Each `Menu.Item` includes `description` prop (Mantine 9 supports `description` on `Menu.Item`) for a one-line blurb
- Selecting a preset calls `renderer.setSettings(preset.rendererSettings)` + `renderer.setPostProcessing(preset.postProcess)`
- Presets apply **in-session only** (not saved to DB); to persist → use Display Config tab (ITER-3)

Constants file: `client/src/widgets/Model3DViewer/constants/displayPresets.ts` (defined in ITER-3)

### 8. Model-in-Scenes Traceability

**Backend**: `GET /models-3d/:id/scenes` — lists scenes that include this model as an object.

**Frontend**: Model card (in models list) — small badge "Used in N scenes" from this endpoint.

### 9. Quick Access on Dashboard

File: `client/src/pages/OrgDashboard/WorkspaceDashboard.tsx` (and `/user` dashboard)

- "Recently opened" section: last 5 models + last 5 scenes
- Stored in `localStorage` under key `@mesh_hub/recent:${userId}` (scoped to user ID to prevent cross-user leakage on shared devices and to avoid stale data after account switching)
- Shape: `{ models: Array<{id, name, thumbnail}>, scenes: Array<{id, name, thumbnail}> }` (max 5 each, newest first)
- Updated on model/scene page visit
- Shown as compact horizontal scroll row of thumbnail cards

---

## Acceptance Criteria

- [ ] Search uses Mantine `Combobox` with Models + Scenes groups; `Combobox.Empty` when no results
- [ ] Drag file onto page shows animated `Transition`-wrapped `Overlay` with upload icon
- [ ] Drop opens pre-filled upload modal
- [ ] Screenshot downloads as PNG
- [ ] Measurement tool places two points and shows distance label in world space
- [ ] Mesh stats displayed as `SimpleGrid cols={2}` of mini stat cards (vertices, faces, meshes, materials)
- [ ] Scene clone creates a full deep copy with "(copy)" suffix
- [ ] Display presets `Menu.Item` shows description; presets apply instantly in the viewport
- [ ] Model card shows "Used in N scenes" count
- [ ] Recently-opened section uses user-scoped localStorage key (`@mesh_hub/recent:${userId}`)
