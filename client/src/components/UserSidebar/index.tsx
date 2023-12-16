import { Box, NavLink, Skeleton, Text, Tooltip } from '@mantine/core';
import { IconCube, IconSettings, IconUser } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { NavLink as RRDNavLink } from 'react-router-dom';
import useCurrentUser from '@/hooks/useCurrentUser.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import { getUserFullName } from '@/utils/user.ts';
import Avatar from './components/Avatar';
import classes from './UserSidebar.module.scss';

export interface UserSidebarProps {
  className?: string;
}

export default function UserSidebar({ className }: UserSidebarProps) {
  const { user, isUserLoading } = useCurrentUser();

  return (
    <Box visibleFrom="sm" className={clsx(classes.root, className)}>
      <Avatar user={user} isLoading={isUserLoading} />
      <Skeleton visible={isUserLoading} mb={24} h={42}>
        <Tooltip
          withArrow
          arrowSize={6}
          label={user ? getUserFullName(user, true) : ''}
          position="right"
          openDelay={500}
          fz={12}
          lh="17px"
        >
          <Text ta="center">{user ? getUserFullName(user) : ''}</Text>
        </Tooltip>
        <Tooltip withArrow arrowSize={6} label={user?.email} position="right" openDelay={500} fz={12} lh="17px">
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
