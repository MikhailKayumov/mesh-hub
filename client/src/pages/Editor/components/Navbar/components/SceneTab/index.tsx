import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { Object3D } from 'three';
import { isObject3D } from '@/components/Model3DViewer/classes/utils';
import { WorldEventNames } from '@/components/Model3DViewer/classes/World';
import { Object3DForm } from '@/pages/Editor/components/Forms';
import { LayersCheckboxGroup } from '@/pages/Editor/components/LayersCheckboxGroup';
import { Object3DOutliner } from '@/pages/Editor/components/Object3DOutliner';
import { SelectedObject3D } from '@/pages/Editor/components/Object3DOutliner/model.ts';
import { SceneTabProps } from './model.ts';
import classes from './SceneTab.module.scss';

export function SceneTab({ className, viewer }: SceneTabProps) {
  const [key, setKey] = useState(0);
  const [selected, setSelected] = useState<SelectedObject3D[]>([]);

  const updateKey = () => setKey((prev) => (prev + 1) % 32);

  useEffect(() => {
    if (!viewer) return;

    const onWorldChange = () => updateKey();

    viewer.world.addEventListener(WorldEventNames.WorldSceneChange, onWorldChange);

    return () => {
      viewer.world.removeEventListener(WorldEventNames.WorldSceneChange, onWorldChange);
    };
  }, [viewer]);

  const filterNode = useCallback(
    (item: Object3D) => {
      return !!viewer && (!!item.children?.length || isObject3D(item)) && viewer.camera.testLayers(item.layers);
    },
    [viewer],
  );

  const onSelectedChange = useCallback((item?: SelectedObject3D[]) => setSelected(item ?? []), []);

  return (
    <div className={clsx(classes.root, className)}>
      <Object3DOutliner
        key={key}
        data={viewer?.world.scene.children ?? []}
        filterNode={filterNode}
        onChange={onSelectedChange}
      />
      <LayersCheckboxGroup viewer={viewer} onChange={updateKey} />
      <Object3DForm selected={selected} />
    </div>
  );
}
