import { IconBulb, IconClockHour4, IconCube, IconMapPin, IconMessageCircle, IconPalette, IconPhotoEdit, IconVolume } from '@tabler/icons-react';
import { DisplayConfigTab } from '@/pages/Editor/components/Navbar/components/DisplayConfigTab';
import { SceneTab } from '@/pages/Editor/components/Navbar/components/SceneTab';
import { LightsTab } from '@/pages/Editor/components/Navbar/components/LightsTab';
import { MaterialsTab } from '@/pages/Editor/components/Navbar/components/MaterialsTab';
import { AudioTab } from '@/pages/Editor/components/Navbar/components/AudioTab';
import { TabValues } from '@/pages/Editor/components/Navbar/constants.ts';
import { AnnotationManager } from '@/widgets/AnnotationManager';
import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import { ReviewPanel } from '@/widgets/ReviewPanel';
import { VersionHistory } from '@/widgets/VersionHistory';
import { type TabsConfig } from './model.ts';
import classes from './Navbar.module.scss';

export const getTabsConfig = (viewer: Viewer | null, modelId?: string): TabsConfig[] | undefined => {
  if (!viewer) return;

  return [
    {
      value: TabValues.DisplayConfig,
      title: <IconPhotoEdit className={classes['tab-icon']} />,
      content: <DisplayConfigTab viewer={viewer} modelId={modelId} />,
    },
    {
      value: TabValues.Scene,
      title: <IconCube className={classes['tab-icon']} />,
      content: <SceneTab viewer={viewer} />,
    },
    {
      value: TabValues.Lights,
      title: <IconBulb className={classes['tab-icon']} />,
      content: <LightsTab viewer={viewer} modelId={modelId} />,
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
    {
      value: TabValues.Versions,
      title: <IconClockHour4 className={classes['tab-icon']} />,
      content: <VersionHistory modelId={modelId ?? ''} canEdit viewer={viewer} />,
    },
    {
      value: TabValues.Materials,
      title: <IconPalette className={classes['tab-icon']} />,
      content: <MaterialsTab viewer={viewer} modelId={modelId} />,
    },
    {
      value: TabValues.Audio,
      title: <IconVolume className={classes['tab-icon']} />,
      content: <AudioTab viewer={viewer} modelId={modelId} />,
    },
  ];
};
