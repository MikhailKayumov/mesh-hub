import { ActionIcon, AppShell, Group, Text } from '@mantine/core';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { clsx } from 'clsx';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ColorSchemeSelect } from '@/components/ColorSchemeSelect';
import { Viewer } from '@/components/Model3DViewer/classes/Viewer';
import { useModel3DContext } from '@/contexts/Model3DContext/useModel3DContext.ts';
import { RouterPaths } from '@/router/paths.ts';
import { canNavigateBack } from '@/utils/canNavigateBack.ts';
import { formatBytes } from '@/utils/format-bytes.ts';
import classes from './Header.module.scss';

export interface HeaderProps {
  className?: string;
  viewer: Viewer | null;
}

export function Header({ className }: HeaderProps) {
  const model3D = useModel3DContext();

  const navigate = useNavigate();
  const close = () => {
    navigate(canNavigateBack() ? -1 : (RouterPaths.Base as any));
  };

  return (
    <AppShell.Header withBorder className={clsx(className)}>
      <Group wrap="nowrap" className={classes.root}>
        <Group wrap="nowrap" px={8} align="center" className={classes.right}>
          <Text miw={180} size="xs" truncate="end">
            MeshHub Editor (α) v1.0.0-alpha
          </Text>
          {model3D && (
            <Text ml="xl" size="md" c="primary" truncate="end">
              {model3D.name}
            </Text>
          )}
        </Group>

        {model3D && (
          <Group className={classes['file-info']}>
            <Group gap={4} className={clsx(classes['file-info-row'], classes['file-info-size'])}>
              <Text className={classes['file-info-text']}>Size:</Text>
              <Text className={classes['file-info-text']}>{formatBytes(model3D.file.size)}</Text>
            </Group>
            <Group gap={4} className={clsx(classes['file-info-row'], classes['file-info-name'])}>
              <Text className={classes['file-info-text']}>Name:</Text>
              <Text className={classes['file-info-text']} truncate="end">
                {model3D.file.name}
              </Text>
            </Group>
            <Group gap={4} className={clsx(classes['file-info-row'], classes['file-info-created'])}>
              <Text className={classes['file-info-text']}>Created:</Text>
              <Text className={classes['file-info-text']}>{dayjs(model3D.createdAt).format('DD.MM.YYYY HH:MM')}</Text>
            </Group>
            <Group gap={4} className={clsx(classes['file-info-row'], classes['file-info-updated'])}>
              <Text className={classes['file-info-text']}>Updated:</Text>
              <Text className={classes['file-info-text']}>{dayjs(model3D.updatedAt).format('DD.MM.YYYY HH:MM')}</Text>
            </Group>
          </Group>
        )}

        <Group wrap="nowrap" className={classes.left} gap={0}>
          <ColorSchemeSelect size={16} variant="subtle" radius={0} />
          <ActionIcon variant="subtle" className={classes['action-button']}>
            <IconDeviceFloppy className={classes.icon} />
          </ActionIcon>
          <ActionIcon variant="subtle" className={classes['action-button']} onClick={close}>
            <IconX className={classes.icon} />
          </ActionIcon>
        </Group>
      </Group>
    </AppShell.Header>
  );
}
