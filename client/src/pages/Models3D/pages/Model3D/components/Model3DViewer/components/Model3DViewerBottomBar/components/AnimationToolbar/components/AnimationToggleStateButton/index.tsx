import { ActionIcon, rem } from '@mantine/core';
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react';
import { UseAnimationsReturn } from '@/pages/Models3D/pages/Model3D/components/Model3DViewer/hooks/useAnimations.ts';

export interface AnimationToggleStateButtonProps {
  animations: UseAnimationsReturn;
}

const iconStyle = { width: rem(18), height: rem(18) };

export default function AnimationToggleStateButton({ animations }: AnimationToggleStateButtonProps) {
  const onClick = () => {
    if (!animations) return;
    animations.setAnimationState(animations.state === 'pause' ? 'play' : 'pause');
  };

  return (
    <ActionIcon mr={4} c="dimmed" variant="transparent" onClick={onClick}>
      {animations.state === 'pause' ? (
        <IconPlayerPlayFilled style={iconStyle} />
      ) : (
        <IconPlayerPauseFilled style={iconStyle} />
      )}
    </ActionIcon>
  );
}
