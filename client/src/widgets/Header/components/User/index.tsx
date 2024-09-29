import { Menu } from '@mantine/core';
import { IconCube, IconLogout, IconSettings, IconSandbox, IconUser } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/entities/user/hooks/useCurrentUser';
import { useLogout } from '@/entities/user/hooks/useLogout';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import { UserButton } from '../UserButton';

export function User() {
  const onLogout = useLogout();
  const { user } = useCurrentUser();

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
        {/* todo: delete the mess */}
        {user?.lastName === 'Каюмов' && (
          <Menu.Item
            component={Link}
            to={buildAbsolutePath([RouterPaths.User, RouterPaths.DevSandbox])}
            leftSection={<IconSandbox size={16} />}
          >
            Sandbox
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item c="red" leftSection={<IconLogout size={16} />} onClick={onLogout}>
          Выйти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
