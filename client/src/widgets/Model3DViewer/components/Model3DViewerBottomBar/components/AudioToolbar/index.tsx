import { ActionIcon, Group, Select, Slider, Text, Tooltip } from '@mantine/core';
import {
  IconVolume,
  IconVolumeOff,
  IconPlayerPlay,
  IconPlayerStop,
  IconRepeat,
  IconRepeatOff,
} from '@tabler/icons-react';
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioLoader } from 'three';
import { useListModelAudioQuery } from '@/app/api/audio.ts';
import type { Audio as ThreeAudio, PositionalAudio } from 'three';
import classes from './AudioToolbar.module.scss';

interface AudioToolbarProps {
  modelId: string;
  className?: string;
  viewer?: {
    playAudio: (url: string, opts?: { loop?: boolean; volume?: number }) => ThreeAudio | PositionalAudio;
    stopAllAudio: () => void;
    audioContext: AudioContext | null;
  };
  modelSrc?: string;
}

export function AudioToolbar({ modelId, className, viewer }: AudioToolbarProps) {
  const { data: tracks = [] } = useListModelAudioQuery({ modelId });
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<ThreeAudio | PositionalAudio | null>(null);
  const loaderRef = useRef<AudioLoader | null>(null);

  // Derived during render: fall back to first track when nothing picked yet
  const selectedId = pickedId ?? tracks[0]?.id ?? null;

  const stop = useCallback(() => {
    if (audioRef.current?.isPlaying) {
      audioRef.current.stop();
    }
    audioRef.current = null;
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (!viewer || !selectedId) return;
    const track = tracks.find((t) => t.id === selectedId);
    if (!track) return;

    stop();

    // Build URL to serve from backend
    const url = `/api/models-3d/${modelId}/audio/${selectedId}/stream`;

    if (!loaderRef.current) {
      loaderRef.current = new AudioLoader();
    }

    const ctx = viewer.audioContext;
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume();
    }

    loaderRef.current.load(url, (buffer) => {
      const audio = viewer.playAudio('', { loop, volume });
      (audio as any).setBuffer(buffer);
      (audio as any).setVolume(volume);
      (audio as any).setLoop(loop);
      (audio as any).play();
      audioRef.current = audio;
      setIsPlaying(true);
      audio.source?.addEventListener('ended', () => {
        if (!loop) setIsPlaying(false);
      });
    });
  }, [viewer, selectedId, tracks, loop, volume, modelId, stop]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.setLoop(loop);
    }
  }, [loop]);

  if (tracks.length === 0) return null;

  const selectData = tracks.map((t) => ({ value: t.id, label: t.originalName }));

  return (
    <Group className={clsx(classes.root, className)} gap={4} wrap="nowrap">
      <Text size="xs" c="dimmed" mr={4}>
        Audio
      </Text>
      <Select
        size="xs"
        data={selectData}
        value={selectedId}
        onChange={setPickedId}
        w={160}
        comboboxProps={{ withinPortal: true }}
      />
      <ActionIcon size="sm" variant="subtle" onClick={isPlaying ? stop : play} disabled={!selectedId || !viewer}>
        {isPlaying ? <IconPlayerStop size={14} /> : <IconPlayerPlay size={14} />}
      </ActionIcon>
      <Tooltip label={loop ? 'Loop: on' : 'Loop: off'}>
        <ActionIcon size="sm" variant={loop ? 'filled' : 'subtle'} onClick={() => setLoop((v) => !v)}>
          {loop ? <IconRepeat size={14} /> : <IconRepeatOff size={14} />}
        </ActionIcon>
      </Tooltip>
      <Tooltip label={`Volume: ${Math.round(volume * 100)}%`}>
        <Slider
          size="xs"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={setVolume}
          w={60}
          label={null}
          thumbSize={10}
        />
      </Tooltip>
      <ActionIcon size="sm" variant="subtle" onClick={() => setVolume(volume === 0 ? 0.8 : 0)}>
        {volume === 0 ? <IconVolumeOff size={14} /> : <IconVolume size={14} />}
      </ActionIcon>
    </Group>
  );
}
