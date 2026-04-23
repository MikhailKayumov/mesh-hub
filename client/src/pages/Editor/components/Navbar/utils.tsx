import { Text } from '@mantine/core';
import { IconBulb, IconCube, IconMapPin, IconMessageCircle, IconPhotoEdit } from '@tabler/icons-react';
import { AnnotationManager } from '@/widgets/AnnotationManager';
import { ReviewPanel } from '@/widgets/ReviewPanel';
import { RendererTab } from '@/pages/Editor/components/Navbar/components/RendererTab';
import { SceneTab } from '@/pages/Editor/components/Navbar/components/SceneTab';
import { TabValues } from '@/pages/Editor/components/Navbar/constants.ts';
import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import { type TabsConfig } from './model.ts';
import classes from './Navbar.module.scss';

export const getTabsConfig = (viewer: Viewer | null, modelId?: string): TabsConfig[] | undefined => {
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
    {
      value: TabValues.Comments,
      title: <IconMessageCircle className={classes['tab-icon']} />,
      content: <ReviewPanel modelId={modelId ?? ''} viewer={viewer} />,
    },
    {
      value: TabValues.Annotations,
      title: <IconMapPin className={classes['tab-icon']} />,
      content: <AnnotationManager modelId={modelId ?? ''} viewer={viewer} canEdit />,
    },
  ];
};
