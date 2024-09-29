import { ScrollArea, Stack } from '@mantine/core';
import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { Object3D, Scene } from 'three';
import { Object3DForm } from '@/pages/Editor/components/Forms';
import { LayersCheckboxGroup } from '@/pages/Editor/components/LayersCheckboxGroup';
import { Object3DOutliner } from '@/pages/Editor/components/Object3DOutliner';
import { SelectedObject3D } from '@/pages/Editor/components/Object3DOutliner/model.ts';
import { isBone, isMesh } from '@/widgets/Model3DViewer/classes/utils';
import { WorldEventNames } from '@/widgets/Model3DViewer/classes/World';
import { SceneTabProps } from './model.ts';
import classes from './SceneTab.module.scss';

export function SceneTab({ className, viewer }: SceneTabProps) {
  const [key, setKey] = useState(0);
  const [selected, setSelected] = useState<SelectedObject3D[]>([]);

  const updateKey = () => setKey((prev) => (prev + 1) % 32);

  useEffect(() => {
    return viewer?.world.on(WorldEventNames.WorldSceneChange, (e: CustomEvent<Scene>) => {
      setSelected([{ object: e.detail.children[0], level: 0 }]);
      updateKey();
    });
  }, [viewer]);

  const filterNode = useCallback(
    (item: Object3D) => {
      if (!viewer) return false;

      const count = item.children?.length ?? 0;

      return viewer.camera.testLayers(item.layers) && (count > 1 || isMesh(item) || isBone(item));
    },
    [viewer],
  );

  const onSelectedChange = useCallback((item?: SelectedObject3D[]) => {
    setSelected(item ?? []);
  }, []);

  return (
    <div className={clsx(classes.root, className)}>
      <Object3DOutliner
        key={key}
        data={viewer?.world.scene.children}
        filterNode={filterNode}
        onSelect={onSelectedChange}
        initialSelected={selected}
      />
      <ScrollArea.Autosize
        mah="100%"
        w="100%"
        scrollbars="y"
        offsetScrollbars="y"
        scrollbarSize={8}
        className={classes.properties}
      >
        <Stack p={8} display="flex" gap={8}>
          <Object3DForm selected={selected} />
          <LayersCheckboxGroup defaultOpened viewer={viewer} onChange={updateKey} />
        </Stack>
      </ScrollArea.Autosize>
    </div>
  );
}
