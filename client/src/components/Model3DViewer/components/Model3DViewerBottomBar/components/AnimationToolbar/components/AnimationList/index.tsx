import { ActionIcon, Menu, rem, ScrollArea, Text } from '@mantine/core';
import { IconPlayerPlayFilled, IconPlaylist } from '@tabler/icons-react';
import { UseAnimationsReturn } from '@/components/Model3DViewer/hooks/useAnimations.ts';
import classes from './AnimationList.module.scss';

export interface AnimationListProps {
  animations: UseAnimationsReturn;
}

const iconStyle = { width: rem(18), height: rem(18) };

export default function AnimationList({ animations }: AnimationListProps) {
  return (
    <Menu position="top-end" closeOnItemClick={false} withinPortal={false}>
      <Menu.Target>
        <ActionIcon c="dimmed" variant="transparent" className={classes['toggle-menu-button']}>
          <IconPlaylist style={iconStyle} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <ScrollArea.Autosize mah={211} offsetScrollbars scrollbarSize={4} mx="auto" scrollbars="y">
          {animations.clips?.map((a, i) => (
            <Menu.Item
              key={i}
              onClick={() => animations.setAnimation(a)}
              className={classes['animation-list-item']}
              rightSection={
                <IconPlayerPlayFilled opacity={a === animations.clip ? 1 : 0} className={classes['play-icon']} />
              }
            >
              <Text truncate="end" size="xs">
                {a.name}
              </Text>
            </Menu.Item>
          ))}
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  );
}
