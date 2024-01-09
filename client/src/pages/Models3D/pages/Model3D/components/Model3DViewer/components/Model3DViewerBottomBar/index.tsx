import { ActionIcon, Group } from '@mantine/core';
import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react';
import AnimationToolbar from '@/pages/Models3D/pages/Model3D/components/AnimationToolbar';
import classes from '@/pages/Models3D/pages/Model3D/components/Model3DViewer/Viewer.module.scss';

export default function Model3DViewerBottomBar() {
  return (
    <Group className={classes['bottom-toolbar']}>
      {/*{animations.clips && (*/}
      {/*  <AnimationToolbar autorun={false} animations={animations} className={classes['animation-toolbar']} />*/}
      {/*)}*/}
    </Group>
  );
}
