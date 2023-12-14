import { Avatar as MAvatar, Group, Skeleton, Overlay, ActionIcon } from '@mantine/core';
import { IconBucket, IconEdit, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { UserCurrentResponseDto } from '@/api/dto.ts';
import { getAvatarSrc } from '@/utils/user.ts';
import classes from './Avatar.module.scss';

export interface AvatarProps {
  user: UserCurrentResponseDto | null;
  isLoading: boolean;
}

export default function Avatar({ user, isLoading }: AvatarProps) {
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [hasAvatar, setHasAvatar] = useState(false);

  const onLoad = (result: boolean) => {
    setHasAvatar(result);
    setIsAvatarLoading(false);
  };

  return (
    <Skeleton circle visible={isLoading || isAvatarLoading} className={classes.root} mb={16}>
      <MAvatar
        src={getAvatarSrc(user)}
        color="primary"
        w="100%"
        h="100%"
        onLoad={() => onLoad(true)}
        onError={() => onLoad(false)}
      />
      <Group className={classes.controls} gap={8} align="flex-end" justify="center">
        <Overlay color="black" backgroundOpacity={0.42} blur={0} className={classes['controls-overlay']} />
        <ActionIcon size="lg" radius="xl" variant="default">
          {hasAvatar ? <IconEdit size={18} /> : <IconPlus size={18} />}
        </ActionIcon>
        {hasAvatar && (
          <ActionIcon size="lg" radius="xl" variant="default">
            <IconBucket size={18} />
          </ActionIcon>
        )}
      </Group>
    </Skeleton>
  );
}
