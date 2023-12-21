import { Box } from '@mantine/core';
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line
// @ts-ignore
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// eslint-disable-next-line
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Box3, BoxHelper, BoxGeometry, Material, Mesh, MeshBasicMaterial, Object3D } from 'three/src/Three.js';
import { Model3DResponseDto } from '@/api/dto.ts';
import { isAxis, isGrid, isLight, isMesh } from '@/components/Viewer/classes/utils';
import { getModel3DFileSrc } from '@/utils/model3d.ts';
import { run } from './classes';
import { Viewer as IViewer } from './classes/types';

export interface ViewerProps {
  model: Model3DResponseDto;
  className?: string;
  onLoad?: () => void;
  onSaveThumbnail?: (thumbnail: string) => void;
}

// @refresh reset
export default function Viewer({ className, model, onLoad, onSaveThumbnail }: ViewerProps) {
  const rootRef = useRef<HTMLDivElement>();
  const [viewer, setViewer] = useState<IViewer | null>(null);

  const getRootRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || rootRef.current === node) return;

    if (viewer) {
      return;
    }

    rootRef.current = node;

    run(node).then((data) => setViewer(data));
  }, []);

  useEffect(() => {
    if (!viewer) return;

    const loadModel = async () => {
      if (!viewer) return;

      if (model.file.extension.includes('fbx')) {
        const loader = new FBXLoader();
        const loadedModel = await loader.loadAsync(getModel3DFileSrc(model.file.id, model.file.name));
        viewer.world.spawn(loadedModel);
      } else {
        const loader = new GLTFLoader();
        const loadedModel = await loader.loadAsync(getModel3DFileSrc(model.file.id, model.file.name));

        loadedModel.scene.scale.set(1, 1, 1);
        loadedModel.scene.traverse((object: Object3D) => {
          if (isMesh(object)) {
            object.castShadow = true;
            object.geometry.computeBoundingBox();
          }
        });

        const boundingBox = new Box3().setFromObject(loadedModel.scene);
        loadedModel.scene.position.set(0, boundingBox.min.y * -1, 0);
        boundingBox.setFromObject(loadedModel.scene);

        const boxgeo = new BoxGeometry();
        const object = new Mesh(boxgeo, new MeshBasicMaterial({ color: 0xff0000 }));
        const box = new BoxHelper(object, 0xff1200);
        box.setFromObject(loadedModel.scene);

        viewer.world.add(loadedModel.scene);
        onLoad?.();
        await viewer.cameraController.fitToBox(boundingBox);
      }
    };

    loadModel().then(() => {
      if (model.thumbnail || !model.isOwner) return;

      try {
        const imgData = viewer.renderer?.getScreenshot();
        onSaveThumbnail?.(imgData);
      } catch (e) {
        console.error(e);
        return;
      }
    });

    return () => {
      viewer?.world.traverse((object) => {
        if (isMesh(object)) {
          object.geometry.dispose();
          (object.material as Material).dispose();
        } else if (isLight(object) || isGrid(object) || isAxis(object)) {
          object.dispose();
        }
      });
      viewer?.world.clear();
      viewer?.renderer.destroy();
      viewer?.cameraController.control?.dispose();
    };
  }, [viewer]);

  return <Box className={clsx(className)} w="100%" h="100%" pos="relative" ref={getRootRef}></Box>;
}
