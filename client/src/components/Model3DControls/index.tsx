import { ActionIcon, Button, Group, Menu, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconDownload, IconEdit, IconTrash } from '@tabler/icons-react';
import useDeleteModel3D from '@/components/Model3DControls/useDeleteModel3D.ts';
import Model3DEditPropertiesDrawer from '@/components/Model3DEditPropertiesDrawer';
import useModel3DContext from '@/contexts/Model3DContext/useModel3DContext.ts';
import { getModel3DFileSrc } from '@/utils/model3d.ts';
import classes from './Model3DControls.module.scss';

export default function Model3DControls() {
  const { model } = useModel3DContext();
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
              href={model ? getModel3DFileSrc(model.file.id, model.file.name) : undefined}
              leftSection={<IconDownload style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
            >
              Скачать
            </Menu.Item>
            {/*<Menu.Item leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}>
              3D Настройки
            </Menu.Item>*/}
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
      {model && <Model3DEditPropertiesDrawer model={model} opened={editPropertiesOpened} onClose={close} />}
    </>
  );
}
