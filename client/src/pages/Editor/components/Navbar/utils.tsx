import { Text } from '@mantine/core';
import { IconBulb, IconCube, IconPhotoEdit } from '@tabler/icons-react';
import { Viewer } from '@/components/Model3DViewer/classes/Viewer';
import { RendererTab } from '@/pages/Editor/components/Navbar/components/RendererTab';
import { SceneTab } from '@/pages/Editor/components/Navbar/components/SceneTab';
import { TabValues } from '@/pages/Editor/components/Navbar/constants.ts';
import { TabsConfig } from './model.ts';
import classes from './Navbar.module.scss';

export const getTabsConfig = (viewer: Viewer | null): TabsConfig[] | undefined => {
  if (!viewer) return;

  return [
    {
      value: TabValues.Renderer,
      title: <IconPhotoEdit className={classes['tab-icon']} />,
      content: <RendererTab viewer={viewer} />,
    },
    {
      value: TabValues.Scene,
      title: <IconCube className={classes['tab-icon']} />,
      content: <SceneTab viewer={viewer} />,
    },
    {
      value: TabValues.Lights,
      title: <IconBulb className={classes['tab-icon']} />,
      content: <Text size="sm">Lights</Text>,
    },
  ];
};
