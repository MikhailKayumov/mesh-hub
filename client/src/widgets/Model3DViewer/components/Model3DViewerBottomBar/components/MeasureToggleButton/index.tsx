import { ActionIcon, rem, Tooltip } from '@mantine/core';
import { IconRulerMeasure } from '@tabler/icons-react';
import { useState } from 'react';
import { useViewerContext } from '../../../../hooks/useViewerContext.ts';

const iconStyle = { width: rem(18), height: rem(18) };

export interface MeasureToggleButtonProps {
  className?: string;
}

export function MeasureToggleButton({ className }: MeasureToggleButtonProps) {
  const viewer = useViewerContext();
  const [active, setActive] = useState(false);

  const onClick = () => {
    if (!viewer) return;
    if (active) {
      viewer.setMode('view');
      setActive(false);
    } else {
      viewer.setMode('measure');
      setActive(true);
    }
  };

  return (
    <Tooltip label="Измерить расстояние" position="top" offset={1} openDelay={1100}>
      <ActionIcon
        c={active ? undefined : 'dimmed'}
        color={active ? 'blue' : undefined}
        variant={active ? 'light' : 'transparent'}
        onClick={onClick}
        className={className}
        disabled={!viewer}
      >
        <IconRulerMeasure style={iconStyle} />
      </ActionIcon>
    </Tooltip>
  );
}
