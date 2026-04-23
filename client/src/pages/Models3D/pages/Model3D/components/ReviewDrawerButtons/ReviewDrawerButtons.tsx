import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconClockHour4, IconMapPin, IconMessageCircle } from '@tabler/icons-react';
import classes from './ReviewDrawerButtons.module.scss';

interface ReviewDrawerButtonsProps {
  onComments: () => void;
  onAnnotations: () => void;
  onVersions: () => void;
}

export function ReviewDrawerButtons({ onComments, onAnnotations, onVersions }: ReviewDrawerButtonsProps) {
  return (
    <Group className={classes.root} gap="xs">
      <Tooltip label="Комментарии">
        <ActionIcon variant="default" size="lg" onClick={onComments}>
          <IconMessageCircle size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Аннотации">
        <ActionIcon variant="default" size="lg" onClick={onAnnotations}>
          <IconMapPin size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="История версий">
        <ActionIcon variant="default" size="lg" onClick={onVersions}>
          <IconClockHour4 size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
