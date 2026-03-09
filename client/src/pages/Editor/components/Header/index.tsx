import { ActionIcon, AppShell, Group, Text } from '@mantine/core';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useModel3DContext } from '@/shared/contexts/Model3DContext/useModel3DContext.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { canNavigateBack } from '@/shared/utils/router.ts';
import { ColorSchemeSelect } from '@/widgets/ColorSchemeSelect';
import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
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
            MeshHub Editor (α) v1.0.0-draft
          </Text>
          {model3D && (
            <Text ml="xl" size="md" c="primary" truncate="end">
              {model3D.name}
            </Text>
          )}
        </Group>
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
