import { ActionIcon, rem } from '@mantine/core';
import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react';

export interface ToggleFullscreenButtonProps {
  fullscreen: boolean;
  toggleFullscreen: () => void;
  className?: string;
}

const iconStyle = { width: rem(18), height: rem(18) };

export function ToggleFullscreenButton({ fullscreen, toggleFullscreen, className }: ToggleFullscreenButtonProps) {
  return (
    <ActionIcon c="dimmed" variant="transparent" onClick={toggleFullscreen} className={className}>
      {fullscreen ? <IconArrowsMinimize style={iconStyle} /> : <IconArrowsMaximize style={iconStyle} />}
    </ActionIcon>
  );
}
