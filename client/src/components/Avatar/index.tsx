import { Avatar as MAvatar, Group, Skeleton, Overlay, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconBucket, IconEdit, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { UserCurrentResponseDto } from '@/api/dto.ts';
import { useUpdateCurrentUserAvatarMutation } from '@/api/user.ts';
import { ChangeAvatarModal } from '@/components/ChangeAvatarModal';
import { getAvatarSrc } from '@/utils/user.ts';
import classes from './Avatar.module.scss';

export interface AvatarProps {
  user: UserCurrentResponseDto | null;
  isLoading: boolean;
}

export function Avatar({ user, isLoading }: AvatarProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [saveAvatar, { isLoading: isDeleting }] = useUpdateCurrentUserAvatarMutation();

  const onDelete = () => {
    saveAvatar({})
      .unwrap()
      .catch((e: any) => {
        notifications.show({
          title: 'Ошибка',
          message: e?.message ?? e?.error ?? 'Неизвестная ошибка',
          color: 'red',
          autoClose: 10000,
        });
      });
  };

  return (
    <Skeleton
      radius="sm"
      visible={isLoading || (isAvatarLoading && !!user?.meta.avatar)}
      className={classes.root}
      mb={16}
    >
      <MAvatar
        src={getAvatarSrc(user)}
        color="primary"
        w="100%"
        h="100%"
        radius="sm"
        onLoad={() => setIsAvatarLoading(false)}
        onError={() => setIsAvatarLoading(false)}
      />
      <Group className={classes.controls} gap={12} align="flex-end" justify="center">
        <Overlay color="black" backgroundOpacity={0.42} blur={0} className={classes['controls-overlay']} />
        <ActionIcon size="lg" radius="sm" variant="default" onClick={open} disabled={isDeleting}>
          {user?.meta.avatar ? <IconEdit size={18} /> : <IconPlus size={18} />}
        </ActionIcon>
        {Boolean(user?.meta.avatar) && (
          <ActionIcon size="lg" radius="sm" variant="default" loading={isDeleting} onClick={onDelete}>
            <IconBucket size={18} />
          </ActionIcon>
        )}
      </Group>
      <ChangeAvatarModal opened={opened} close={close} currentImage={getAvatarSrc(user)} />
    </Skeleton>
  );
}
