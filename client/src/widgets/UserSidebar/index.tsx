import { Box, NavLink, Skeleton, Text, Tooltip } from '@mantine/core';
import { IconCube, IconSettings, IconUser } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { NavLink as RRDNavLink } from 'react-router-dom';
import { useCurrentUser } from '@/entities/user/hooks/useCurrentUser.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import { getUserFullName } from '@/shared/utils/user.ts';
import { Avatar } from '../Avatar';
import classes from './UserSidebar.module.scss';

export interface UserSidebarProps {
  className?: string;
}

export function UserSidebar({ className }: UserSidebarProps) {
  const { user, isUserLoading } = useCurrentUser();

  return (
    <Box visibleFrom="sm" className={clsx(classes.root, className)}>
      <Avatar user={user} isLoading={isUserLoading} />
      <Skeleton visible={isUserLoading} mb={24} h={42}>
        <Tooltip label={user ? getUserFullName(user, true) : ''} position="right" openDelay={500}>
          <Text ta="center">{user ? getUserFullName(user) : ''}</Text>
        </Tooltip>
        <Tooltip label={user?.email} position="right" openDelay={500}>
          <Text ta="center" truncate="end" size="xs" c="dimmed">
            {user?.email}
          </Text>
        </Tooltip>
      </Skeleton>
      <Box component="nav" className={classes.navlinks}>
        <NavLink
          label="Модели"
          className={classes.navlink}
          component={RRDNavLink}
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.Models])}
          leftSection={<IconCube size={20} />}
        />
        <NavLink
          label="Профиль"
          className={classes.navlink}
          component={RRDNavLink}
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.Profile])}
          leftSection={<IconUser size={20} />}
        />
        <NavLink
          label="Настройки"
          className={classes.navlink}
          component={RRDNavLink}
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.Settings])}
          leftSection={<IconSettings size={20} />}
        />
      </Box>
    </Box>
  );
}
