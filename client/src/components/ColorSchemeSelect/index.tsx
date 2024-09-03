import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { getButtonIconStyle, MENU_ICON_STYLE } from '@/components/ColorSchemeSelect/constants.ts';
import { ColorSchemeSelectProps } from '@/components/ColorSchemeSelect/model.ts';
import { useCurrentColorScheme } from '@/shared/hooks/useCurrentColorScheme.ts';

export function ColorSchemeSelect({ size = 22, variant = 'transparent', color, radius }: ColorSchemeSelectProps) {
  const { isLight, isDark } = useCurrentColorScheme();
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Menu position="bottom-end" offset={4} arrowPosition="center" shadow={isLight ? 'sm' : undefined}>
      <Menu.Target>
        <ActionIcon variant={variant} c={color} radius={radius}>
          {isDark ? <IconMoon style={getButtonIconStyle(size)} /> : <IconSun style={getButtonIconStyle(size)} />}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => setColorScheme('light')} leftSection={<IconSun style={MENU_ICON_STYLE} />}>
          Светлая
        </Menu.Item>
        <Menu.Item onClick={() => setColorScheme('dark')} leftSection={<IconMoon style={MENU_ICON_STYLE} />}>
          Темная
        </Menu.Item>
        <Menu.Item onClick={() => setColorScheme('auto')} leftSection={<IconDeviceDesktop style={MENU_ICON_STYLE} />}>
          Системная
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
