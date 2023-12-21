import { ActionIcon, Button, Group, Menu, rem } from '@mantine/core';
import { IconChevronDown, IconDownload, IconEdit, IconSettings, IconTrash } from '@tabler/icons-react';
import { Model3DFileResponseDto } from '@/api/dto.ts';
import useDeleteModel3D from '@/components/Model3DControls/useDeleteModel3D.ts';
import { getModel3DFileSrc } from '@/utils/model3d.ts';
import classes from './Model3DControls.module.scss';

export interface Model3DControlsProps {
  id: string;
  file: Model3DFileResponseDto;
}

export default function Model3DControls({ id, file }: Model3DControlsProps) {
  const { onDelete, isDeleting } = useDeleteModel3D(id);

  return (
    <Group wrap="nowrap" gap={0}>
      <Button className={classes.button} leftSection={<IconEdit size={18} />} loading={isDeleting}>
        Редактировать
      </Button>
      <Menu position="bottom-end" withinPortal disabled={isDeleting}>
        <Menu.Target>
          <ActionIcon variant="filled" size={36} className={classes.menuControl}>
            <IconChevronDown style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            component="a"
            download
            href={getModel3DFileSrc(file.id, file.name)}
            leftSection={<IconDownload style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
          >
            Скачать
          </Menu.Item>
          <Menu.Item leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}>
            3D Настройки
          </Menu.Item>
          <Menu.Item
            c="red"
            onClick={onDelete}
            leftSection={<IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
          >
            Удалить
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
