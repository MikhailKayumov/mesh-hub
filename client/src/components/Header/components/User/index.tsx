import { Menu } from '@mantine/core';
import { IconCube, IconLogout, IconSettings, IconUser } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import useLogout from '@/hooks/useLogout.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import UserButton from '../UserButton';

export default function User() {
  const onLogout = useLogout();

  return (
    <Menu position="bottom-end" width={200}>
      <Menu.Target>
        <UserButton />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          component={Link}
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.Models])}
          leftSection={<IconCube size={16} />}
        >
          Модели
        </Menu.Item>
        <Menu.Item
          component={Link}
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.Profile])}
          leftSection={<IconUser size={16} />}
        >
          Профиль
        </Menu.Item>
        <Menu.Item
          component={Link}
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.Settings])}
          leftSection={<IconSettings size={16} />}
        >
          Настройки
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item c="red" leftSection={<IconLogout size={16} />} onClick={onLogout}>
          Выйти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
