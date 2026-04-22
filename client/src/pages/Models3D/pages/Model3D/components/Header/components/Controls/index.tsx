import { ActionIcon, Button, Group, Menu, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconDownload, IconEdit, IconSettings, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useModel3DContext } from '@/shared/contexts/Model3DContext/useModel3DContext.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { getBoolean } from '@/shared/utils/env.ts';
import { getModel3DFileSrc } from '@/shared/utils/model3d.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import { Model3DEditPropertiesDrawer } from '../EditPropertiesDrawer';
import classes from './Model3DControls.module.scss';
import { useDeleteModel3D } from './useDeleteModel3D.ts';

export function Model3DControls() {
  const model = useModel3DContext();
  const { onDelete, isDeleting } = useDeleteModel3D(model?.id);
  const [editPropertiesOpened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Group wrap="nowrap" gap={0}>
        <Button className={classes.button} leftSection={<IconEdit size={18} />} loading={isDeleting} onClick={open}>
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
              disabled={!model}
              href={model ? getModel3DFileSrc(model.id, model.file.name) : undefined}
              leftSection={<IconDownload style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
            >
              Скачать
            </Menu.Item>
            {getBoolean('VITE_APP_ENABLE_EDITOR') && (
              <Menu.Item
                component={Link}
                to={buildAbsolutePath([RouterPaths.Editor, RouterPaths.Id], { params: { id: model?.id } })}
                leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
              >
                3D Настройки
              </Menu.Item>
            )}
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
      {model && <Model3DEditPropertiesDrawer opened={editPropertiesOpened} onClose={close} />}
    </>
  );
}
