# ITER-5 — Animations Enhanced + Audio

## Goal

Extend the existing animation player with speed, loop mode, crossfade, and active clip label. Add animation support to scenes (per-object AnimationMixer, playback config, sequence). Add audio system (Three.js positional audio + backend storage).

## Status: 🔲 Pending

---

## Animation Player Improvements

### Current state (gaps identified)

| Gap | Fix |
|---|---|
| No speed control | Add 0.25× / 0.5× / 1× / 2× buttons |
| No loop mode toggle | `LoopRepeat` / `LoopOnce` / `LoopPingPong` |
| No crossfade | `prevAction.fadeOut(0.3)` → `newAction.reset().fadeIn(0.3).play()` |
| Active clip not shown in collapsed toolbar | Show clip name as `Text` beside play button |
| Time in raw seconds | Format as `mm:ss` |
| `key={i}` in AnimationList | Change to `key={clip.uuid}` |

### 1. `AnimationToolbar` improvements

File: `client/src/widgets/Model3DViewer/components/Model3DViewerBottomBar/components/AnimationToolbar/index.tsx`

Changes:
- Show active clip name as `Badge` beside play button (lineClamp=1, max-width)
- **Speed control:** `SegmentedControl` with data `[{value:'0.25',label:'0.25×'},{value:'0.5',label:'0.5×'},{value:'1',label:'1×'},{value:'2',label:'2×'}]` — visually shows active speed; replaces `ActionIcon group`
- **Loop mode:** single `ActionIcon` cycling Repeat → Once → PingPong → Repeat; wrapped in `<Tooltip label={currentModeLabel}>` — icons: `IconRepeat` / `IconRepeatOff` / `IconArrowsLeftRight`

### 2. `AnimationProgress` — mm:ss format

File: `.../AnimationToolbar/components/AnimationProgress/`

- Format `currentTime` and `clip.duration` as `mm:ss`
  ```ts
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  ```

### 3. `AnimationList` — key fix + crossfade

File: `.../AnimationToolbar/components/AnimationList/`

- `key={clip.uuid}` (was `key={i}`)
- On clip select → crossfade: `prevAction.fadeOut(0.3)` → `newAction.reset().fadeIn(0.3).play()`

### 4. `useAnimations` hook — speed + loop

File: `client/src/widgets/Model3DViewer/hooks/useAnimations.ts`

- Add `speed: number` state + `setSpeed(v: number): void` → `action.timeScale = v`
- Add `loopMode: AnimationActionLoopStyles` state + `setLoopMode(m): void` → `action.loop = m; action.reset().play()`
- Return both in the hook interface

---

## Scene Animations

### 5. `Viewer.loadScene()` — preserve animations

File: `client/src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`

- Keep `loaded.animations` per loaded object
- Build `Map<sceneObjectId, AnimationMixer>` in Viewer
- Register all mixers as renderer callbacks (`mixer.update(delta)`)
- Expose `getObjectAnimations(sceneObjectId): AnimationClip[]`
- Expose `getObjectMixer(sceneObjectId): AnimationMixer | undefined`

### 6. New `SceneAnimationsPanel`

File: `client/src/pages/SceneEditor/panels/SceneAnimationsPanel.tsx`

**Scene Editor tab:** Add Animations tab (`IconPlayerPlay`) to Scene Editor navbar (defined in ITER-2's tab setup; added in this iteration). Tab is hidden if no scene objects have animations.

- Per-object accordion item: object name as header + clip list + play/pause controls
- Same speed `SegmentedControl` + loop mode `ActionIcon` + `Tooltip` as model editor
- Global "Play All" button — plays all object mixers simultaneously
- Auto-play toggle per object: `Switch` (persisted in `scene_object.animation_config`)
- **Empty state:** `EmptyData` widget with "No animated objects in scene" when no mixers exist

### 7. DB — `scene_object.animation_config`

Migration: add `animation_config jsonb` to `scenes.scene_object`

```json
{
  "autoplay": false,
  "activeClipName": null,
  "loop": "repeat",
  "speed": 1.0,
  "sequence": [
    { "name": "Walk", "loop": "repeat", "transitionDuration": 0.3 },
    { "name": "Run", "loop": "once",   "transitionDuration": 0.3 }
  ]
}
```

`PATCH /api/scenes/:id/objects/:objId` — accept `animationConfig` field in `SceneObjectUpsertDto`.

---

## Audio System

### 8. DB Migration

New table: `model_3d.model_audio`

```sql
CREATE TABLE model_3d.model_audio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES model_3d.model_3d(id) ON DELETE CASCADE,
  filename varchar(255) NOT NULL,
  original_name varchar(255) NOT NULL,
  duration_s float8,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 9. Backend — audio endpoints

`server/src/modules/models-3d/audio/`

- `POST /models-3d/:id/audio` — upload (MP3 / OGG / WAV, max 20 MB)
- `GET /models-3d/:id/audio` — list tracks
- `GET /models-3d/:id/audio/:audioId/file` — stream / redirect (`@Public()`)
- `DELETE /models-3d/:id/audio/:audioId`

### 10. Three.js Audio setup

File: `client/src/widgets/Model3DViewer/classes/Viewer/Viewer.ts`

- `init()` → `const listener = new THREE.AudioListener(); camera.add(listener)`
- Expose `playAudio(url: string, options: { positional: boolean; volume: number; loop: boolean })`: void`
- Positional: attach `THREE.PositionalAudio` to model root object; global: `THREE.Audio`
- `stopAllAudio(): void`

### 11. `AudioToolbar`

File: `client/src/widgets/Model3DViewer/components/Model3DViewerBottomBar/components/AudioToolbar/`

- Only shown if model has audio tracks (`useModelAudioQuery(modelId).data.length > 0`)
- Track list `Select` dropdown
- Play/pause `ActionIcon` + volume `Slider` (0–1)
- Loop toggle `ActionIcon` wrapped in `Tooltip`
- All icons wrapped in `Tooltip`

**Audio tab in Model Editor (`IconVolume`):**

File: Add `audio` tab to `getTabsConfig()` in `client/src/pages/Editor/components/Navbar/utils.tsx`

Tab content shows uploaded audio files as rows:
```
┌─────────────────────────────────┐
│  ♫ ambient.mp3  [global] ▶ ✕  │  ← filename + Badge + preview ActionIcon + delete
│  ♫ footsteps.ogg [pos]  ▶ ✕  │
└─────────────────────────────────┘
```
- `Badge variant="light"` — "global" / "positional" per track
- Preview `ActionIcon IconPlayerPlay` — plays audio in viewer
- Delete `ActionIcon IconTrash` — `modals.openConfirmModal()` before delete
- `FileButton` "Upload Audio" at bottom of list
- **Empty state:** `EmptyData` with "No audio files" + upload button

**Audio autoplay policy handling:**

Browsers block `AudioContext` until a user gesture. On model load:

```ts
if (viewer.audioContext.state === 'suspended') {
  // Show overlay — user must click to enable audio
}
```

Implement as a `Transition`-animated `Overlay` on the viewer canvas:
```tsx
<Transition mounted={audioBlocked} transition="fade" duration={200}>
  {(styles) => (
    <Overlay style={styles} backgroundOpacity={0.5}>
      <Center h="100%">
        <Button leftSection={<IconVolume size={20} />}
          onClick={() => viewer.audioContext.resume().then(() => setAudioBlocked(false))}>
          Click to enable audio
        </Button>
      </Center>
    </Overlay>
  )}
</Transition>
```

Overlay appears only when the model actually has audio tracks AND `audioContext.state === 'suspended'`. Disappears after user clicks.

### 12. scene_object audio config

`scene_object.animation_config` extended with `audio`:

```json
{
  "audio": {
    "audioId": "uuid",
    "loop": true,
    "volume": 0.8,
    "positional": true,
    "maxDistance": 20
  }
}
```

In `SceneAnimationsPanel` → Audio section per selected object.

---

## Acceptance Criteria

### Animations
- [ ] Speed control uses `SegmentedControl` (0.25× / 0.5× / 1× / 2×) and shows active value
- [ ] Loop mode `ActionIcon` cycles Repeat / Once / PingPong with `Tooltip` label
- [ ] Crossfade between clips (no abrupt cut)
- [ ] Active clip name shown beside play button
- [ ] Time displayed as mm:ss
- [ ] `key={clip.uuid}` (no React reconciliation issues)
- [ ] Scene objects animate when scene loads (if model has animations)
- [ ] `SceneAnimationsPanel` shown as Animations tab in Scene Editor (ITER-2 tab added here)
- [ ] SceneAnimationsPanel allows per-object play control
- [ ] Animation config persists in DB and restores on scene load

### Audio
- [ ] Audio files upload to model (MP3 / OGG / WAV)
- [ ] AudioToolbar appears when model has audio; all controls have Tooltips
- [ ] Audio tab in Model Editor shows track list with upload/delete
- [ ] "Enable audio" overlay appears when `audioContext.state === 'suspended'`; clicking resumes audio context
- [ ] Positional and global audio modes work in the viewer
- [ ] Per scene-object audio config persists and auto-plays on scene load
