import { ActionIcon, Box, Tooltip } from '@mantine/core';
import { IconPhotoSensor } from '@tabler/icons-react';
import { useRef } from 'react';
import useAnimations from '@/components/Viewer/hooks/useAnimations.ts';
import usePreventMiddleClick from '@/components/Viewer/hooks/usePreventMiddleClick';
import useViewer, { UseViewerProps } from '@/components/Viewer/hooks/useViewer.ts';
import useModel3DContext from '@/contexts/Model3DContext/useModel3DContext.ts';
import AnimationToolbar from '@/pages/Models3D/pages/Model3D/components/AnimationToolbar';
import classes from './Viewer.module.scss';

export interface Model3DPageViewerProps extends Omit<UseViewerProps, 'model'> {}

export default function Model3DPageViewer({ onInit, onLoad }: Model3DPageViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { onMouseEnter, onMouseLeave } = usePreventMiddleClick();
  const { model, saveThumbnail, isThumbnailSaving } = useModel3DContext();
  const { viewer, placeRef, animationData } = useViewer({ model, onLoad, onInit });
  const animations = useAnimations(viewer, animationData);

  const onSaveThumbnailClick = () => {
    if (!viewer || !saveThumbnail) return;
    saveThumbnail(viewer.renderer.getScreenshot());
  };
  const toggleFullscreen = async () => {
    if (!rootRef.current) return;

    if (!document.fullscreenElement) {
      await rootRef.current.requestFullscreen();
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  };

  return (
    <Box ref={rootRef} className={classes.root} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Box ref={placeRef} className={classes.viewer} />
      {model?.isOwner && (
        <Box className={classes.controls}>
          <Tooltip label="Сохранить портрет" position="top-start" offset={1} openDelay={1100}>
            <ActionIcon
              loading={isThumbnailSaving}
              className={classes['controls-action']}
              onClick={onSaveThumbnailClick}
            >
              <IconPhotoSensor className={classes['controls-action-icon']} />
            </ActionIcon>
          </Tooltip>
        </Box>
      )}
      {animations.clips && (
        <AnimationToolbar
          autorun
          animations={animations}
          className={classes['animation-toolbar']}
          toggleFullscreen={toggleFullscreen}
        />
      )}
    </Box>
  );
}
