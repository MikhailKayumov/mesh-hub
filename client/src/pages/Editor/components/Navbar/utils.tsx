import { Tabs, Text } from '@mantine/core';
import { IconCube, IconPhotoEdit } from '@tabler/icons-react';
import { Viewer } from '@/components/Model3DViewer/classes/Viewer';
import { RendererTab } from '@/pages/Editor/components/Navbar/components/RendererTab';
import { TabValues } from '@/pages/Editor/components/Navbar/constants.tsx';
import { TabsConfig } from './model.ts';
import classes from './Navbar.module.scss';

export const createTabsElements = (config: TabsConfig[]) => {
  return config.reduce<[any[], any[]]>(
    (acc, c) => {
      acc[0].push(
        <Tabs.Tab key={c.value} value={c.value} className={classes.tab}>
          {c.title}
        </Tabs.Tab>,
      );
      acc[1].push(
        <Tabs.Panel key={c.value} value={c.value} className={classes.content}>
          {c.content}
        </Tabs.Panel>,
      );
      return acc;
    },
    [[], []],
  );
};

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
      content: <Text size="sm">Scene</Text>,
    },
  ];
};
