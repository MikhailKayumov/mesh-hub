import { ActionIcon, Box, Group, Tooltip } from '@mantine/core';
import { useFullscreen } from '@mantine/hooks';
import { IconArrowsMaximize, IconArrowsMinimize, IconPhotoSensor } from '@tabler/icons-react';
import useAnimations from '@/components/Viewer/hooks/useAnimations.ts';
import useModel3DContext from '@/contexts/Model3DContext/useModel3DContext.ts';
import AnimationToolbar from '@/pages/Models3D/pages/Model3D/components/AnimationToolbar';
import usePreventMiddleClick from './hooks/usePreventMiddleClick.ts';
import useViewer, { UseViewerProps } from './hooks/useViewer.ts';
import classes from './Viewer.module.scss';

export interface Model3DPageViewerProps extends Omit<UseViewerProps, 'model'> {}

export default function Model3DViewer({ onInit, onLoad }: Model3DPageViewerProps) {
  const { ref: rootRef, toggle: toggleFullscreen, fullscreen } = useFullscreen();
  const { onMouseEnter, onMouseLeave } = usePreventMiddleClick();

  const model = useModel3DContext();

  const { placeRef, viewer, animationData } = useViewer({ model, onLoad, onInit });
  // const animations = useAnimations(viewer, animationData);

  return (
    <Box ref={rootRef} className={classes.root} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Box ref={placeRef} className={classes.viewer} />
      {/*{model?.isOwner && (*/}
      {/*  <Box className={classes.controls}>*/}
      {/*    <Tooltip label="Сохранить портрет" position="top-start" offset={1} openDelay={1100}>*/}
      {/*      <ActionIcon*/}
      {/*        // loading={isThumbnailSaving}*/}
      {/*        className={classes['controls-action']}*/}
      {/*        // onClick={onSaveThumbnailClick}*/}
      {/*      >*/}
      {/*        <IconPhotoSensor className={classes['controls-action-icon']} />*/}
      {/*      </ActionIcon>*/}
      {/*    </Tooltip>*/}
      {/*  </Box>*/}
      {/*)}*/}
      {/*<Group className={classes['bottom-toolbar']}>*/}
      {/*  {animations.clips && (*/}
      {/*    <AnimationToolbar autorun={false} animations={animations} className={classes['animation-toolbar']} />*/}
      {/*  )}*/}
      {/*  <ActionIcon c="dimmed" variant="transparent" onClick={toggleFullscreen}>*/}
      {/*    {fullscreen ? (*/}
      {/*      <IconArrowsMinimize className={classes.icon} />*/}
      {/*    ) : (*/}
      {/*      <IconArrowsMaximize className={classes.icon} />*/}
      {/*    )}*/}
      {/*  </ActionIcon>*/}
      {/*</Group>*/}
    </Box>
  );
}
