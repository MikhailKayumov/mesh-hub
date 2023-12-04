import { ActionIcon, Menu, rem, useMantineColorScheme } from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';

export default function ColorSchemeSelect() {
  const { isLight, isDark } = useCurrentColorScheme();
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Menu position="bottom-end" offset={4} arrowPosition="center" shadow={isLight ? 'sm' : undefined}>
      <Menu.Target>
        <ActionIcon variant="transparent" c={isLight ? 'black' : 'white'}>
          {isDark ? (
            <IconMoon style={{ width: rem(22), height: rem(22) }} />
          ) : (
            <IconSun style={{ width: rem(22), height: rem(22) }} />
          )}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => setColorScheme('light')}
          leftSection={<IconSun style={{ width: rem(16), height: rem(16) }} />}
        >
          Светлая
        </Menu.Item>
        <Menu.Item
          onClick={() => setColorScheme('dark')}
          leftSection={<IconMoon style={{ width: rem(16), height: rem(16) }} />}
        >
          Темная
        </Menu.Item>
        <Menu.Item
          onClick={() => setColorScheme('auto')}
          leftSection={<IconDeviceDesktop style={{ width: rem(16), height: rem(16) }} />}
        >
          Системная
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
