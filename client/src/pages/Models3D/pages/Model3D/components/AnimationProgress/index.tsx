import { Group, Slider } from '@mantine/core';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { UseAnimationsReturn } from '@/components/Viewer/hooks/useAnimations.ts';
import { formatAnimationTime } from '@/pages/Models3D/pages/Model3D/components/AnimationProgress/utils.ts';
import classes from './AnimationProgress.module.scss';

export interface AnimationProgressProps {
  animations: UseAnimationsReturn;
}

// @refresh reset
export default function AnimationProgress({ animations }: AnimationProgressProps) {
  const prevAnimationStateRef = useRef(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const onAnimationTimeChange = (value: number) => {
    if (!animations.action) return;
    setAnimationTime(value);
    animations.action.time = value;
  };

  useEffect(() => {
    if (!animations.action) return;

    let rafId: ReturnType<typeof requestAnimationFrame> = 0;
    let lastTime = 0;

    const onProgressChange = (elapsed: number) => {
      const delta = (elapsed - lastTime) * 0.001;

      if (delta >= 0.1) {
        lastTime = elapsed;
        setAnimationTime(animations.action?.time ?? 0);
      }

      rafId = requestAnimationFrame(onProgressChange);
    };

    rafId = requestAnimationFrame(onProgressChange);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [animations.action]);
  useEffect(() => {
    if (!animations.action) return;

    if (isInteracting) {
      prevAnimationStateRef.current = animations.action.paused;
      animations.action.paused = true;
    } else {
      animations.action.paused = prevAnimationStateRef.current;
    }
  }, [isInteracting]);

  return (
    <Group className={clsx(classes.root, isInteracting && classes['is-interacting'])}>
      <Slider
        size="sm"
        color="primary"
        defaultValue={0}
        step={0.01}
        max={animations.action?.getClip().duration}
        value={animationTime}
        label={formatAnimationTime}
        onChange={onAnimationTimeChange}
        onChangeEnd={() => setIsInteracting(false)}
        onPointerDown={() => setIsInteracting(true)}
      />
    </Group>
  );
}
