import { ActionIcon, Menu, Text } from '@mantine/core';
import { IconPlayerPlayFilled, IconPlaylist } from '@tabler/icons-react';
import { UseAnimationsReturn } from '@/components/Viewer/hooks/useAnimations.ts';
import classes from './AnimationList.module.scss';

export interface AnimationListProps {
  animations: UseAnimationsReturn;
}

export default function AnimationList({ animations }: AnimationListProps) {
  return (
    <Menu position="top-end" closeOnItemClick={false}>
      <Menu.Target>
        <ActionIcon c="dimmed" variant="transparent" className={classes['toggle-menu-button']}>
          <IconPlaylist className={classes['toggle-menu-button-icon']} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
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
      </Menu.Dropdown>
    </Menu>
  );
}
