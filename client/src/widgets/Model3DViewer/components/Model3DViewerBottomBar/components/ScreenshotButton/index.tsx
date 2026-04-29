import { ActionIcon, rem, Tooltip } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';
import { sleep } from '@/shared/utils/sleep.ts';
import { useViewerContext } from '../../../../hooks/useViewerContext.ts';

const iconStyle = { width: rem(18), height: rem(18) };

export interface ScreenshotButtonProps {
  className?: string;
}

export function ScreenshotButton({ className }: ScreenshotButtonProps) {
  const viewer = useViewerContext();

  const onClick = async () => {
    if (!viewer) return;

    await sleep(0.05);
    const dataUrl = viewer.renderer.getScreenshot();
    const blob = await (await fetch(dataUrl)).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewer.model?.data?.name ?? 'screenshot'}-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Tooltip label="Сохранить скриншот" position="top" offset={1} openDelay={1100}>
      <ActionIcon c="dimmed" variant="transparent" onClick={onClick} className={className}>
        <IconCamera style={iconStyle} />
      </ActionIcon>
    </Tooltip>
  );
}
