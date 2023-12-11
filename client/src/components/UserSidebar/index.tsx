import { Avatar, Box, NavLink, ScrollArea, Skeleton, Text, Tooltip } from '@mantine/core';
import { IconCube, IconSettings, IconUser } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { NavLink as RRDNavLink } from 'react-router-dom';
import useCurrentUser from '@/hooks/useCurrentUser.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import userService from '@/services/user';
import classes from './UserSidebar.module.scss';

export interface UserSidebarProps {
  className?: string;
}

export default function UserSidebar({ className }: UserSidebarProps) {
  const { user, isUserLoading } = useCurrentUser();

  return (
    <Box visibleFrom="sm" className={clsx(classes.root, className)}>
      <Skeleton circle visible={isUserLoading} className={classes.avatar} mb={16}>
        <Avatar
          color="primary"
          // src={'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-3.png'}
          size="xl"
          w="100%"
          h="100%"
        />
      </Skeleton>
      <Skeleton visible={isUserLoading} mb={32} h={42}>
        <Tooltip label={user ? userService.getUserFullname(user, true) : ''} position="right" openDelay={500} fz={12}>
          <Text ta="center">{user ? userService.getUserFullname(user) : ''}</Text>
        </Tooltip>
        <Tooltip label={user?.email} position="right" openDelay={500} fz={12}>
          <Text ta="center" truncate="end" size="xs" c="dimmed">
            {user?.email}
          </Text>
        </Tooltip>
      </Skeleton>
      <ScrollArea offsetScrollbars scrollbarSize={6} scrollHideDelay={100}>
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
      </ScrollArea>
    </Box>
  );
}
