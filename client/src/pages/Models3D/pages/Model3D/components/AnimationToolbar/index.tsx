import { ActionIcon, Group } from '@mantine/core';
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { UseAnimationsReturn } from '@/components/Viewer/hooks/useAnimations.ts';
import AnimationList from '@/pages/Models3D/pages/Model3D/components/AnimationList';
import AnimationProgress from '@/pages/Models3D/pages/Model3D/components/AnimationProgress';
import classes from './AnimationToolbar.module.scss';

export interface AnimationToolbarProps {
  animations: UseAnimationsReturn;
  blends?: {
    fadeInDuration: number;
    fadeOutDuration: number;
  };
  autorun?: boolean;
  className?: string;
}

export default function AnimationToolbar({ animations, blends, autorun = false, className }: AnimationToolbarProps) {
  const prevActionRef = useRef(animations.action);
  const [isPaused, setIsPaused] = useState(autorun);

  const onPlayToggle = () => {
    if (!animations.action) return;

    animations.action.paused = !animations.action.paused;
    setIsPaused(animations.action.paused);
  };

  useEffect(() => {
    if (!animations.action) return;

    const paused = prevActionRef.current?.paused || !autorun;

    prevActionRef.current = animations.action;

    animations.action.reset().fadeIn(blends?.fadeInDuration ?? 0.25);
    animations.action.paused = paused;
    animations.action.play();

    setIsPaused(paused);

    return () => {
      prevActionRef.current?.fadeOut(blends?.fadeInDuration ?? 0.25);
    };
  }, [animations.action]);

  return (
    <Group px="sm" py="sm" gap={8} className={clsx(classes.root, className)} align="center">
      <ActionIcon c="dimmed" variant="transparent" onClick={onPlayToggle}>
        {isPaused ? (
          <IconPlayerPlayFilled className={classes.icon} />
        ) : (
          <IconPlayerPauseFilled className={classes.icon} />
        )}
      </ActionIcon>
      <AnimationProgress animations={animations} />
      <AnimationList animations={animations} />
    </Group>
  );
}
