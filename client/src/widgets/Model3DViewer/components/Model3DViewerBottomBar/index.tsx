import { Group } from '@mantine/core';
import type { Audio as ThreeAudio } from 'three';
import classes from './BottomBar.module.scss';
import { AnimationToolbar } from './components/AnimationToolbar';
import { AudioToolbar } from './components/AudioToolbar';
import { ToggleFullscreenButton } from './components/ToggleFullscreenButton';

interface AudioViewer {
  playAudio: (url: string, opts?: { loop?: boolean; volume?: number }) => ThreeAudio;
  stopAllAudio: () => void;
  audioContext: AudioContext | null;
}

export interface Model3DViewerBottomBarProps {
  fullscreen: boolean;
  toggleFullscreen: () => void;
  modelId?: string;
  viewer?: AudioViewer;
}

export function Model3DViewerBottomBar({ fullscreen, toggleFullscreen, modelId, viewer }: Model3DViewerBottomBarProps) {
  return (
    <Group className={classes.root} gap={0}>
      <AnimationToolbar autorun className={classes.animations} />
      {modelId && (
        <AudioToolbar modelId={modelId} viewer={viewer} className={classes.audio} />
      )}
      <ToggleFullscreenButton
        className={classes['toggle-fullscreen-button']}
        fullscreen={fullscreen}
        toggleFullscreen={toggleFullscreen}
      />
    </Group>
  );
}
