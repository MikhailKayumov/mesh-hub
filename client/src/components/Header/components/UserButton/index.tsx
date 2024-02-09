import { Avatar, Group, UnstyledButton, Text, rem, Stack, Skeleton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { ComponentPropsWithoutRef, forwardRef, useState } from 'react';
import { useCurrentColorScheme } from '@/hooks/useCurrentColorScheme.ts';
import { useCurrentUser } from '@/hooks/useCurrentUser.ts';
import { getAvatarInitials, getAvatarSrc, getUserFullName } from '@/utils/user.ts';
import classes from './UserButton.module.scss';

export const UserButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>((props, ref) => {
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const { isUserLoading, user } = useCurrentUser();
  const { isLight } = useCurrentColorScheme();

  return (
    <UnstyledButton ref={ref} {...props} className={classes.root}>
      <Group gap={rem(10)}>
        <Skeleton circle visible={isUserLoading || (isAvatarLoading && !!user?.meta.avatar)} w={38} h={38}>
          <Avatar
            src={getAvatarSrc(user)}
            radius="xl"
            size="md"
            className={classes.avatar}
            onLoad={() => setIsAvatarLoading(false)}
            onError={() => setIsAvatarLoading(false)}
          >
            {user ? getAvatarInitials(user) : undefined}
          </Avatar>
        </Skeleton>
        <Stack gap={0}>
          {isUserLoading ? (
            <Skeleton h={16} w={140} />
          ) : (
            <Text size="sm" c={isLight ? 'black' : 'white'} fw={600}>
              {user ? getUserFullName(user) : ''}
            </Text>
          )}
          {isUserLoading ? (
            <Skeleton h={16} w={140} mt={4} />
          ) : (
            <Text c="dimmed" size="xs">
              {user?.email}
            </Text>
          )}
        </Stack>
        <IconChevronDown
          size="1rem"
          className={clsx(classes.icon, (props as any)['data-expanded'] && classes['icon-menu-open'])}
        />
      </Group>
    </UnstyledButton>
  );
});
