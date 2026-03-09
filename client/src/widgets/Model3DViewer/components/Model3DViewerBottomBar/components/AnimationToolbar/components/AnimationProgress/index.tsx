import { Group, Slider } from '@mantine/core';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { type AnimationState, type UseAnimationsReturn } from '@/widgets/Model3DViewer/hooks/useAnimations.ts';
import { useViewerContext } from '@/widgets/Model3DViewer/hooks/useViewerContext.ts';
import classes from './AnimationProgress.module.scss';
import { formatAnimationTime } from './utils.ts';

export interface AnimationProgressProps {
  animations: UseAnimationsReturn;
}

export function AnimationProgress({ animations }: AnimationProgressProps) {
  const viewer = useViewerContext();
  const prevAnimationStateRef = useRef<AnimationState>(animations.state);
  const [animationTime, setAnimationTime] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!animations.action || !viewer) return;

    let elapsed = 0;

    const onProgressChange = (delta: number) => {
      elapsed += delta;

      if (elapsed >= 0.1) {
        elapsed = 0;
        setAnimationTime(animations.action?.time ?? 0);
      }
    };

    viewer.renderer.addCallback(onProgressChange);

    return () => {
      viewer.renderer.removeCallback(onProgressChange);
    };
  }, [animations.action, viewer]);
  useEffect(() => {
    if (!animations.action) return;

    if (isInteracting) {
      prevAnimationStateRef.current = animations.state;
      animations.setAnimationState('pause');
    } else {
      animations.setAnimationState(prevAnimationStateRef.current);
    }
  }, [isInteracting]);

  const onAnimationTimeChange = (value: number) => {
    if (!animations.action) return;
    setAnimationTime(value);
    // eslint-disable-next-line react-hooks/immutability
    animations.action.time = value;
  };

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
