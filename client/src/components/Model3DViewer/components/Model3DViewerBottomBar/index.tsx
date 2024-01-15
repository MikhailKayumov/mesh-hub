import { Group } from '@mantine/core';
import classes from './BottomBar.module.scss';
import AnimationToolbar from './components/AnimationToolbar';
import ToggleFullscreenButton from './components/ToggleFullscreenButton';

export interface Model3DViewerBottomBarProps {
  fullscreen: boolean;
  toggleFullscreen: () => void;
}

export default function Model3DViewerBottomBar({ fullscreen, toggleFullscreen }: Model3DViewerBottomBarProps) {
  return (
    <Group className={classes.root} gap={0}>
      <AnimationToolbar autorun className={classes.animations} />
      <ToggleFullscreenButton
        className={classes['toggle-fullscreen-button']}
        fullscreen={fullscreen}
        toggleFullscreen={toggleFullscreen}
      />
    </Group>
  );
}
