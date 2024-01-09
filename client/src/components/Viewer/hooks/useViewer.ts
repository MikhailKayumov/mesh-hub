import { useEffect, useRef, useState } from 'react';
import { AnimationObjectGroup, Box3, Object3D, Vector3 } from 'three';
import { Model3DResponseDto } from '@/api/dto.ts';
import sleep from '@/utils/sleep.ts';
import { initViewer } from '../classes';
import { Loader } from '../classes/Loader';
import { Viewer } from '../classes/types';
import { isMesh, isSkinnedMesh } from '../classes/utils';
import { UseAnimationsProps } from './useAnimations.ts';

export interface UseViewerProps {
  model?: Model3DResponseDto;
  onInit?: (viewer: Viewer) => void | Promise<void>;
  onLoad?: (viewer: Viewer) => void | Promise<void>;
}

export default function useViewer({ model, onLoad }: UseViewerProps) {
  const placeRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [animationData, setAnimationData] = useState<UseAnimationsProps | undefined>(undefined);

  // 1. init viewer
  useEffect(() => {
    if (!placeRef.current) {
      console.warn('Place for rendering was not found');
      return;
    }

    if (viewer) {
      if (placeRef.current !== viewer.renderer.getPlace()) {
        viewer.renderer.setPlace(placeRef.current);
      }
      return;
    }

    setViewer(initViewer(placeRef.current));
  }, []);

  // 2. init viewer
  useEffect(() => {
    if (!viewer) return;

    viewer.camera.on(viewer.renderer.getCanvas());
    if (viewer.stats) {
      viewer.renderer.addCallback(() => viewer.stats?.update());
    }

    return () => {
      viewer?.world.destroy();
      viewer?.camera.off();
      viewer?.renderer.destroy();
    };
  }, [viewer]);

  // 3. load 3d model
  useEffect(() => {
    if (!viewer || !model) return;

    viewer.renderer.render();

    const loadModel = async () => {
      const { scene, animations: loadedAnimations } = await Loader.load(model);

      viewer.world.spawn(scene);
      viewer.renderer.render();

      const bb = new Box3().makeEmpty();
      const ag: AnimationObjectGroup = new AnimationObjectGroup();

      scene.traverse((object: Object3D) => {
        if (isSkinnedMesh(object)) {
          const vector = new Vector3();

          for (let i = 0; i < object.geometry.attributes.position.count; i++) {
            vector.fromBufferAttribute(object.geometry.attributes.position, i);
            object.applyBoneTransform(i, vector);
            object.localToWorld(vector);
            bb.expandByPoint(vector);
          }

          object.computeBoundingBox();
          object.computeBoundingSphere();

          ag.add(object);
        } else if (isMesh(object)) {
          object.geometry.computeBoundingBox();
          object.geometry.computeBoundingSphere();
        }
      });

      if (bb.isEmpty()) {
        bb.setFromObject(scene);
      }

      scene.translateY(bb.min.y * -1);
      bb.translate(new Vector3(0, bb.min.y * -1, 0));

      await viewer.world.prepare();

      if (ag.stats.objects.total && loadedAnimations?.length) {
        setAnimationData({ objectGroup: ag, clips: loadedAnimations });
      } else {
        setAnimationData(undefined);
      }

      viewer.renderer.run();

      await sleep(0.02);

      onLoad?.(viewer);

      // viewer.world.spawn(new Box3Helper(bb, '#5d5d5d'));
      await viewer.camera.fitToBox(bb);
    };

    loadModel();
  }, [viewer, model?.file.id]);

  // 4. spawn world grid
  // useEffect(() => {
  //   if (!viewer) return;
  //
  //   viewer.world.spawnGridHelper(
  //     30,
  //     30,
  //     isLight ? colors.gray[3] : colors.dark[4],
  //     isLight ? colors.gray[2] : colors.dark[6],
  //   );
  //
  //   viewer.world.spawnGroundHelper(isLight ? colors.gray[3] : colors.dark[4]);
  // }, [viewer, isLight]);

  return {
    viewer,
    placeRef,
    animationData,
  };
}
