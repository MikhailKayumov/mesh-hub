import { ActionIcon, Menu, rem, Tooltip } from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import type { PostProcessConfig, RendererSettings } from '../../../../classes/types/renderer.ts';
import { DISPLAY_PRESETS, type DisplayPreset } from '../../../../constants/displayPresets.ts';
import { useViewerContext } from '../../../../hooks/useViewerContext.ts';

const iconStyle = { width: rem(18), height: rem(18) };

export interface DisplayPresetsMenuProps {
  className?: string;
}

export function DisplayPresetsMenu({ className }: DisplayPresetsMenuProps) {
  const viewer = useViewerContext();

  const applyPreset = (preset: DisplayPreset) => {
    if (!viewer) return;

    const rendererSettings: RendererSettings = {
      ...((preset.rendererConfig ?? {}) as RendererSettings),
      clearColor: preset.backgroundColor,
    };
    viewer.renderer.setSettings(rendererSettings);

    viewer.renderer.setPostProcessing((preset.postProcess ?? {}) as PostProcessConfig);
  };

  return (
    <Menu position="top" shadow="md" withArrow>
      <Menu.Target>
        <Tooltip label="Пресеты отображения" position="top" offset={1} openDelay={1100}>
          <ActionIcon c="dimmed" variant="transparent" className={className}>
            <IconAdjustments style={iconStyle} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {DISPLAY_PRESETS.map((preset) => (
          <Menu.Item key={preset.label} onClick={() => applyPreset(preset)}>
            <div>
              <div style={{ fontWeight: 500 }}>{preset.label}</div>
              <div style={{ fontSize: rem(12), opacity: 0.7 }}>{preset.description}</div>
            </div>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
