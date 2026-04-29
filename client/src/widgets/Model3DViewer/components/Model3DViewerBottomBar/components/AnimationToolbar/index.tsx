import { ActionIcon, Badge, Group, rem, SegmentedControl, Tooltip } from '@mantine/core';
import { IconArrowsLeftRight, IconRepeat, IconRepeatOff } from '@tabler/icons-react';
import { LoopOnce, LoopPingPong, LoopRepeat, type AnimationActionLoopStyles } from 'three';
import { useAnimations, type UseAnimationsProps } from '../../../../hooks/useAnimations';
import { AnimationList } from './components/AnimationList';
import { AnimationProgress } from './components/AnimationProgress';
import { AnimationToggleStateButton } from './components/AnimationToggleStateButton';

export interface AnimationToolbarProps extends UseAnimationsProps {
  className?: string;
}

const SPEED_DATA = [
  { value: '0.25', label: '0.25×' },
  { value: '0.5', label: '0.5×' },
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
];

const LOOP_MODES: {
  mode: AnimationActionLoopStyles;
  icon: React.FC<{ style?: React.CSSProperties }>;
  label: string;
}[] = [
  { mode: LoopRepeat, icon: IconRepeat, label: 'Repeat' },
  { mode: LoopOnce, icon: IconRepeatOff, label: 'Play Once' },
  { mode: LoopPingPong, icon: IconArrowsLeftRight, label: 'Ping-Pong' },
];

const iconStyle = { width: rem(18), height: rem(18) };

export function AnimationToolbar({ className, ...props }: AnimationToolbarProps) {
  const animations = useAnimations(props);
  if (!animations) return;

  const loopEntry = LOOP_MODES.find((m) => m.mode === animations.loopMode) ?? LOOP_MODES[0];
  const nextLoopMode = LOOP_MODES[(LOOP_MODES.indexOf(loopEntry) + 1) % LOOP_MODES.length].mode;
  const LoopIcon = loopEntry.icon;

  return (
    <Group gap={0} mr={10} className={className} align="center" wrap="nowrap">
      <AnimationList animations={animations} />
      {animations.clip?.duration && (
        <>
          <Badge
            variant="light"
            maw={120}
            mr={4}
            style={{
              cursor: 'default',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {animations.clip.name}
          </Badge>
          <AnimationToggleStateButton animations={animations} />
          <AnimationProgress animations={animations} />
          <SegmentedControl
            size="xs"
            mx={8}
            value={String(animations.speed)}
            onChange={(v) => animations.setSpeed(Number(v))}
            data={SPEED_DATA}
          />
          <Tooltip label={loopEntry.label}>
            <ActionIcon c="dimmed" variant="transparent" onClick={() => animations.setLoopMode(nextLoopMode)}>
              <LoopIcon style={iconStyle} />
            </ActionIcon>
          </Tooltip>
        </>
      )}
    </Group>
  );
}
