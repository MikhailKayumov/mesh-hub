import { Avatar, Box, Card, Group, Menu, rem, Text, Tooltip } from '@mantine/core';
import { IconDotsVertical, IconSettings, IconTrash } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import type { Model3DResponseDto } from '@/app/api/dto.ts';
import { useDeleteModel3D } from '@/pages/Models3D/pages/Model3D/components/Header/components/Controls/useDeleteModel3D.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { getBoolean } from '@/shared/utils/env.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import { getAvatarSrcByString } from '@/shared/utils/user.ts';
import classes from '../../Models3DList.module.scss';
import { Model3DCardThumbnail } from '../Model3DCardThumbnail';

export interface Model3DCard {
  model: Model3DResponseDto;
}

export function Model3DCard({ model }: Model3DCard) {
  const { onDelete, isDeleting } = useDeleteModel3D(model?.id);

  return (
    <Card withBorder className={clsx(classes.card, isDeleting && classes['card-deleting'])} p={0}>
      <Model3DCardThumbnail id={model.id} name={model.name} fileId={model.id} thumbnail={model.thumbnail} />
      <Group wrap="nowrap" gap={0} p="xs" py="xs">
        <Tooltip label={model.ownerName} withArrow position="top-start" offset={1} openDelay={500}>
          <Avatar radius="xs" src={getAvatarSrcByString(model.ownerAvatar)} color="primary" size={22} />
        </Tooltip>
        <Tooltip label={model.name} position="top-start" openDelay={500}>
          <Text
            c="text"
            ml={6}
            size="sm"
            truncate="end"
            className={classes['model-name']}
            component={Link}
            to={buildAbsolutePath([RouterPaths.Models, model.id])}
          >
            {model.name}
          </Text>
        </Tooltip>
        {model.isOwner && getBoolean('VITE_APP_ENABLE_EDITOR') && (
          <Menu position="left-end" openDelay={75} closeDelay={80} width={200} offset={1} trigger="hover" withArrow>
            <Menu.Target>
              <Box className={classes['menu-button']}>
                <IconDotsVertical size={18} />
              </Box>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                disabled={isDeleting}
                component={Link}
                to={buildAbsolutePath([RouterPaths.Editor, model.id])}
                leftSection={<IconSettings size={16} />}
              >
                3D настройки
              </Menu.Item>
              <Menu.Item
                disabled={isDeleting}
                c="red"
                onClick={onDelete}
                leftSection={<IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
              >
                Удалить
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Card>
  );
}
