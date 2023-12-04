import { Menu } from '@mantine/core';
import { IconCube, IconLogout, IconSettings, IconUser } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import useLogout from '@/hooks/useLogout.ts';
import UserButton from '@/modules/Header/components/UserButton';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';

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
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.MyModels])}
          leftSection={<IconCube size={16} />}
        >
          Модели
        </Menu.Item>
        <Menu.Item
          component={Link}
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.MyProfile])}
          leftSection={<IconUser size={16} />}
        >
          Профиль
        </Menu.Item>
        <Menu.Item
          component={Link}
          to={buildAbsolutePath([RouterPaths.User, RouterPaths.MySettings])}
          leftSection={<IconSettings size={16} />}
        >
          Настройки
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item c="red.4" leftSection={<IconLogout size={16} />} onClick={onLogout}>
          Выйти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
