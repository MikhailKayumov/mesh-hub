import { ActionIcon, Box, rem, Tooltip } from '@mantine/core';
import { IconPhotoSensor } from '@tabler/icons-react';
import { clsx } from 'clsx';
import useViewer, { UseViewerProps } from '@/components/Viewer/hooks/useViewer.ts';
import usePreventMiddleClick from './hooks/usePreventMiddleClick.ts';
import classes from './Viewer.module.scss';

export interface ViewerProps extends UseViewerProps {
  className?: string;
}

export default function Viewer({ className, ...props }: ViewerProps) {
  const { viewer, placeRef } = useViewer(props);
  const { onMouseEnter, onMouseLeave } = usePreventMiddleClick();

  return (
    <Box
      ref={placeRef}
      className={clsx(classes.root, className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Box className={classes.controls}>
        <Tooltip label="Сохранить портрет" position="top-start" offset={1} openDelay={1100}>
          <ActionIcon
            className={classes['controls-action']}
            onClick={() => {
              props.onSaveThumbnail?.(viewer?.renderer.getScreenshot() ?? '');
            }}
          >
            <IconPhotoSensor style={{ width: rem(18), height: rem(18) }} />
          </ActionIcon>
        </Tooltip>
      </Box>
    </Box>
  );
}
