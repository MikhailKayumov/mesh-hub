import { IconBulb, IconCube, IconMessage, IconPlayerPlay, IconSettings } from '@tabler/icons-react';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import type { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import type { SceneTabsConfig } from './model.ts';
import type { SelectionState } from '../../hooks/model.ts';
import type { AnimationClip, AnimationMixer } from 'three';
import { SceneAnimationsPanel } from '../../panels/SceneAnimationsPanel';
import { SceneConfigPanel } from '../../panels/SceneConfigPanel';
import { SceneLightsPanel } from '../../panels/SceneLightsPanel';
import { SceneObjectsPanel } from '../../panels/SceneObjectsPanel';
import { SceneReviewPanel } from '../../panels/SceneReviewPanel.tsx';
import { SceneTabValues } from './constants.ts';
import classes from './SceneNavbar.module.scss';

interface GetSceneTabsConfigOptions {
  scene: SceneResponseDto;
  viewer: Viewer | null;
  selectionState: SelectionState;
  onSelectObject: (id: string | null) => void;
  onSelectLight: (id: string | null) => void;
  syncLights: (lights: SceneResponseDto['lights']) => void;
  updateBackgroundColor: (hex: string) => void;
  updateAmbientLight: (intensity: number) => void;
  loadHdri: (url: string) => void;
  getObjectAnimations: (id: string) => AnimationClip[];
  getObjectMixer: (id: string) => AnimationMixer | undefined;
  getAnimatedObjectIds: () => string[];
  isSceneLoading: boolean;
}

export function getSceneTabsConfig({
  scene,
  viewer,
  selectionState,
  onSelectObject,
  onSelectLight,
  syncLights,
  updateBackgroundColor,
  updateAmbientLight,
  loadHdri,
  getObjectAnimations,
  getObjectMixer,
  getAnimatedObjectIds,
  isSceneLoading,
}: GetSceneTabsConfigOptions): SceneTabsConfig[] {
  const selectedObjectId = selectionState?.type === 'object' ? selectionState.id : null;
  const selectedLightId = selectionState?.type === 'light' ? selectionState.id : null;

  return [
    {
      value: SceneTabValues.Objects,
      title: <IconCube className={classes['tab-icon']} />,
      content: <SceneObjectsPanel scene={scene} selectedObjectId={selectedObjectId} onSelectObject={onSelectObject} />,
    },
    {
      value: SceneTabValues.Lights,
      title: <IconBulb className={classes['tab-icon']} />,
      content: (
        <SceneLightsPanel
          scene={scene}
          selectedLightId={selectedLightId}
          onSelectLight={onSelectLight}
          syncLights={syncLights}
        />
      ),
    },
    {
      value: SceneTabValues.Config,
      title: <IconSettings className={classes['tab-icon']} />,
      content: (
        <SceneConfigPanel
          scene={scene}
          updateBackgroundColor={updateBackgroundColor}
          updateAmbientLight={updateAmbientLight}
          loadHdri={loadHdri}
        />
      ),
    },
    {
      value: SceneTabValues.Animations,
      title: <IconPlayerPlay className={classes['tab-icon']} />,
      content: (
        <SceneAnimationsPanel
          scene={scene}
          getObjectAnimations={getObjectAnimations}
          getObjectMixer={getObjectMixer}
          getAnimatedObjectIds={getAnimatedObjectIds}
          isSceneLoading={isSceneLoading}
        />
      ),
    },
    {
      value: SceneTabValues.Review,
      title: <IconMessage className={classes['tab-icon']} />,
      content: <SceneReviewPanel sceneId={scene.id} viewer={viewer} onSelectObject={onSelectObject} />,
    },
  ];
}
