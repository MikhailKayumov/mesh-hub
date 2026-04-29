import { AppShell, Tabs, Tooltip } from '@mantine/core';
import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import type { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import type { SelectionState } from '../../hooks/model.ts';
import type { AnimationClip, AnimationMixer } from 'three';
import { SceneTabValues, type SceneTabValue } from './constants.ts';
import classes from './SceneNavbar.module.scss';
import { getSceneTabsConfig } from './utils.tsx';

interface SceneNavbarProps {
  className?: string;
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

const TAB_TOOLTIPS: Record<SceneTabValue, string> = {
  objects: 'Objects',
  lights: 'Lights',
  config: 'Scene Config',
  animations: 'Animations',
  review: 'Review',
};

export function SceneNavbar({
  className,
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
}: SceneNavbarProps) {
  const [tabValue, setTabValue] = useState<SceneTabValue>(SceneTabValues.Objects);
  const [prevSelection, setPrevSelection] = useState<SelectionState>(null);

  // Adjust state on selection change: auto-switch to Lights tab when a light is freshly selected.
  // setState during render is supported by React for "adjust state on prop change".
  if (selectionState !== prevSelection) {
    setPrevSelection(selectionState);
    if (selectionState?.type === 'light' && prevSelection?.type !== 'light') {
      setTabValue(SceneTabValues.Lights);
    }
  }

  const config = useMemo(
    () =>
      getSceneTabsConfig({
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
      }),

    [scene, viewer, selectionState, isSceneLoading],
  );

  return (
    <AppShell.Navbar p={0} withBorder className={clsx(classes.root, className)}>
      <Tabs value={tabValue} onChange={(v) => setTabValue(v as SceneTabValue)}>
        <Tabs.List className={classes.tabs}>
          {config.map((c) => (
            <Tooltip key={c.value} label={TAB_TOOLTIPS[c.value]} position="right" withArrow>
              <Tabs.Tab value={c.value} className={clsx(classes.tab, tabValue === c.value && classes.active)}>
                {c.title}
              </Tabs.Tab>
            </Tooltip>
          ))}
        </Tabs.List>
        {config.map((c) => (
          <Tabs.Panel key={c.value} value={c.value} className={classes.content}>
            {c.content}
          </Tabs.Panel>
        ))}
      </Tabs>
    </AppShell.Navbar>
  );
}
