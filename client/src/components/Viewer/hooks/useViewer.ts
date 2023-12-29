import { useEffect, useRef, useState } from 'react';
import { AnimationObjectGroup, Box3, Object3D, Vector3 } from 'three';
import { Model3DResponseDto } from '@/api/dto.ts';
import { initViewer } from '@/components/Viewer/classes';
import { Viewer } from '@/components/Viewer/classes/types';
import { isBone, isMesh, isSkinnedMesh } from '@/components/Viewer/classes/utils';
import { prepareWorld } from '@/components/Viewer/classes/World/prepareWorld.ts';
import { UseAnimationsProps } from '@/components/Viewer/hooks/useAnimations.ts';
import sleep from '@/utils/sleep.ts';
import { Loader } from '../classes/Loader';

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
    viewer.renderer.addCallback(() => viewer.stats.update());

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
        if (isBone(object)) {
          // console.log(new Vector3().setFromMatrixPosition(object.matrixWorld));
          // bb.expandByPoint(new Vector3().setFromMatrixPosition(object.matrixWorld));
        } else if (isSkinnedMesh(object)) {
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
          // console.log(object);
          object.geometry.computeBoundingBox();
          object.geometry.computeBoundingSphere();
        } else {
          // console.log(object);
        }
      });

      if (bb.isEmpty()) {
        bb.setFromObject(scene);
      }

      scene.translateY(bb.min.y * -1);
      bb.translate(new Vector3(0, bb.min.y * -1, 0));

      await prepareWorld(viewer.world);

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
