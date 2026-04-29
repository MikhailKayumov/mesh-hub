import {
  ActionIcon,
  Accordion,
  Badge,
  Divider,
  Group,
  NumberInput,
  rem,
  ScrollArea,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconArrowsLeftRight, IconPlayerPause, IconPlayerPlay, IconRepeat, IconRepeatOff } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { LoopOnce, LoopPingPong, LoopRepeat } from 'three';
import { useListModelAudioQuery } from '@/app/api/audio.ts';
import type { SceneObjectAudioConfigDto, SceneObjectResponseDto, SceneResponseDto } from '@/app/api/dto.ts';
import { useUpdateSceneObjectMutation } from '@/app/api/scenes.ts';
import { EmptyData } from '@/widgets/EmptyData';
import type { AnimationActionLoopStyles, AnimationClip, AnimationMixer } from 'three';

const SPEED_DATA = [
  { value: '0.25', label: '0.25×' },
  { value: '0.5', label: '0.5×' },
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
];

const LOOP_MODES: {
  mode: AnimationActionLoopStyles;
  icon: React.FC<{ style?: React.CSSProperties }>;
  label: string;
}[] = [
  { mode: LoopRepeat, icon: IconRepeat, label: 'Repeat' },
  { mode: LoopOnce, icon: IconRepeatOff, label: 'Play Once' },
  { mode: LoopPingPong, icon: IconArrowsLeftRight, label: 'Ping-Pong' },
];

const iconStyle = { width: rem(16), height: rem(16) };

interface ObjectAudioConfigProps {
  sceneId: string;
  obj: SceneObjectResponseDto;
}

function ObjectAudioConfig({ sceneId, obj }: ObjectAudioConfigProps) {
  const { data: tracks = [] } = useListModelAudioQuery({ modelId: obj.model.id });
  const [updateSceneObject] = useUpdateSceneObjectMutation();

  const audioConfig = obj.audioConfig as SceneObjectAudioConfigDto | null | undefined;

  const handleChange = (patch: Partial<SceneObjectAudioConfigDto>) => {
    const current = audioConfig ?? { audioId: tracks[0]?.id ?? '' };
    updateSceneObject({
      sceneId,
      objectId: obj.id,
      body: { audioConfig: { ...current, ...patch } },
    });
  };

  const handleClear = () => {
    updateSceneObject({ sceneId, objectId: obj.id, body: { audioConfig: null } });
  };

  if (!tracks.length) return null;

  return (
    <>
      <Divider label="Audio" labelPosition="left" />
      <Select
        size="xs"
        label="Track"
        placeholder="None"
        clearable
        value={audioConfig?.audioId ?? null}
        onChange={(id) => {
          if (id === null) {
            handleClear();
          } else {
            handleChange({ audioId: id });
          }
        }}
        data={tracks.map((t) => ({ value: t.id, label: t.originalName }))}
      />
      {audioConfig?.audioId && (
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Volume
          </Text>
          <Slider
            size="xs"
            min={0}
            max={1}
            step={0.01}
            value={audioConfig.volume ?? 1}
            onChangeEnd={(v) => handleChange({ volume: v })}
          />
          <Group gap="xs">
            <Switch
              size="xs"
              label="Loop"
              checked={audioConfig.loop ?? false}
              onChange={(e) => handleChange({ loop: e.currentTarget.checked })}
            />
            <Switch
              size="xs"
              label="Autoplay"
              checked={audioConfig.autoplay ?? false}
              onChange={(e) => handleChange({ autoplay: e.currentTarget.checked })}
            />
            <Switch
              size="xs"
              label="Positional"
              checked={audioConfig.positional ?? false}
              onChange={(e) => handleChange({ positional: e.currentTarget.checked })}
            />
          </Group>
          {audioConfig.positional && (
            <NumberInput
              size="xs"
              label="Max Distance"
              min={1}
              max={10000}
              value={audioConfig.maxDistance ?? 100}
              onBlur={(e) => handleChange({ maxDistance: Number(e.currentTarget.value) })}
            />
          )}
        </Stack>
      )}
    </>
  );
}

interface ObjectAnimationControlsProps {
  sceneId: string;
  obj: SceneObjectResponseDto;
  clips: AnimationClip[];
  mixer: AnimationMixer;
}

function ObjectAnimationControls({ sceneId, obj, clips, mixer }: ObjectAnimationControlsProps) {
  const [activeClipName, setActiveClipName] = useState<string>(clips[0]?.name ?? '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1');
  const [loopMode, setLoopMode] = useState<AnimationActionLoopStyles>(LoopRepeat);
  const prevActionRef = useRef<ReturnType<AnimationMixer['clipAction']> | null>(null);

  const activeClip = clips.find((c) => c.name === activeClipName) ?? clips[0];

  const getOrCreateAction = (clip: AnimationClip) => {
    return mixer.clipAction(clip);
  };

  const applyClip = (clip: AnimationClip, play: boolean) => {
    const newAction = getOrCreateAction(clip);
    const prev = prevActionRef.current;

    if (prev && prev !== newAction) {
      prev.fadeOut(0.3);
      newAction.reset().fadeIn(0.3).play();
      newAction.paused = !play;
    } else {
      newAction.reset().fadeIn(0.25).play();
      newAction.paused = !play;
    }

    newAction.timeScale = Number(speed);
    newAction.loop = loopMode;
    newAction.clampWhenFinished = loopMode === LoopOnce;

    prevActionRef.current = newAction;
  };

  const handleClipChange = (name: string | null) => {
    if (!name) return;
    setActiveClipName(name);
    const clip = clips.find((c) => c.name === name);
    if (!clip) return;
    applyClip(clip, isPlaying);
  };

  const handlePlayPause = () => {
    const action = getOrCreateAction(activeClip);
    if (isPlaying) {
      action.paused = true;
      setIsPlaying(false);
    } else {
      if (!prevActionRef.current || prevActionRef.current !== action) {
        applyClip(activeClip, true);
      } else {
        action.paused = false;
      }
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (value: string) => {
    setSpeed(value);
    const action = getOrCreateAction(activeClip);
    action.timeScale = Number(value);
  };

  const handleLoopModeToggle = () => {
    const nextEntry = LOOP_MODES[(LOOP_MODES.findIndex((m) => m.mode === loopMode) + 1) % LOOP_MODES.length];
    setLoopMode(nextEntry.mode);
    const action = getOrCreateAction(activeClip);
    action.loop = nextEntry.mode;
    action.clampWhenFinished = nextEntry.mode === LoopOnce;
  };

  const loopEntry = LOOP_MODES.find((m) => m.mode === loopMode) ?? LOOP_MODES[0];
  const LoopIcon = loopEntry.icon;

  return (
    <Accordion.Item key={obj.id} value={obj.id}>
      <Accordion.Control>
        <Group gap={6}>
          <Text size="sm" fw={500} lineClamp={1}>
            {obj.model.name}
          </Text>
          <Badge size="xs" variant="dot" color={isPlaying ? 'green' : 'gray'}>
            {clips.length} clip{clips.length !== 1 ? 's' : ''}
          </Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="xs">
          {clips.length > 1 && (
            <Select
              size="xs"
              label="Clip"
              value={activeClipName}
              onChange={handleClipChange}
              data={clips.map((c) => ({ value: c.name, label: c.name }))}
            />
          )}
          <Group gap="xs" align="center">
            <ActionIcon variant="light" onClick={handlePlayPause}>
              {isPlaying ? <IconPlayerPause style={iconStyle} /> : <IconPlayerPlay style={iconStyle} />}
            </ActionIcon>
            <SegmentedControl size="xs" flex={1} value={speed} onChange={handleSpeedChange} data={SPEED_DATA} />
            <Tooltip label={loopEntry.label}>
              <ActionIcon c="dimmed" variant="transparent" onClick={handleLoopModeToggle}>
                <LoopIcon style={iconStyle} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <ObjectAudioConfig sceneId={sceneId} obj={obj} />
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

export interface SceneAnimationsPanelProps {
  scene: SceneResponseDto;
  getObjectAnimations: (id: string) => AnimationClip[];
  getObjectMixer: (id: string) => AnimationMixer | undefined;
  getAnimatedObjectIds: () => string[];
  isSceneLoading: boolean;
}

export function SceneAnimationsPanel({
  scene,
  getObjectAnimations,
  getObjectMixer,
  getAnimatedObjectIds,
  isSceneLoading,
}: SceneAnimationsPanelProps) {
  // Derive animated IDs directly from the viewer once the scene is loaded.
  // `getAnimatedObjectIds` is a cheap Map.keys() read on the viewer.
  const animatedIds = isSceneLoading ? [] : getAnimatedObjectIds();
  const animatedObjects = scene.objects.filter((obj) => animatedIds.includes(obj.id));

  if (animatedObjects.length === 0) {
    return <EmptyData label={isSceneLoading ? 'Loading scene…' : 'No animated objects in this scene'} />;
  }

  return (
    <ScrollArea h="100%">
      <Accordion variant="contained" radius="xs" chevronPosition="left">
        {animatedObjects.map((obj) => {
          const clips = getObjectAnimations(obj.id);
          const mixer = getObjectMixer(obj.id);
          if (!mixer || !clips.length) return null;
          return <ObjectAnimationControls key={obj.id} sceneId={scene.id} obj={obj} clips={clips} mixer={mixer} />;
        })}
      </Accordion>
    </ScrollArea>
  );
}
