import { Group } from '@mantine/core';
import { useAnimations, type UseAnimationsProps } from '../../../../hooks/useAnimations';
import { AnimationList } from './components/AnimationList';
import { AnimationProgress } from './components/AnimationProgress';
import { AnimationToggleStateButton } from './components/AnimationToggleStateButton';

export interface AnimationToolbarProps extends UseAnimationsProps {
  className?: string;
}

export function AnimationToolbar({ className, ...props }: AnimationToolbarProps) {
  const animations = useAnimations(props);
  if (!animations) return;

  return (
    <Group gap={0} mr={10} className={className} align="center">
      <AnimationList animations={animations} />
      {animations.clip?.duration && (
        <>
          <AnimationToggleStateButton animations={animations} />
          <AnimationProgress animations={animations} />
        </>
      )}
    </Group>
  );
}
