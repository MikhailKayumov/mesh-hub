import { useSafeMantineTheme } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { Box3, Box3Helper, Group } from 'three/src/Three.js';
import { Model3DResponseDto } from '@/api/dto.ts';
import { run } from '@/components/Viewer/classes';
import { Loader } from '@/components/Viewer/classes/loader';
import { Viewer } from '@/components/Viewer/classes/types';
import { prepareWorld } from '@/components/Viewer/classes/World/prepareWorld.ts';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';

export interface UseViewerProps {
  model: Model3DResponseDto;
  onInit?: (viewer: Viewer) => void;
  onLoad?: (viewer: Viewer) => void;
  onSaveThumbnail?: (thumbnail: string) => void;
}

// @refresh reset
export default function useViewer({ model, onLoad }: UseViewerProps) {
  const { isLight } = useCurrentColorScheme();
  const { colors } = useSafeMantineTheme();

  const [viewer, setViewer] = useState<Viewer | null>(null);
  const placeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placeRef.current) {
      console.warn('Place for rendering was not found');
      return;
    }

    if (viewer) {
      // viewer.renderer.setPlace(placeRef.current);
      return;
    }

    run(placeRef.current).then((v) => {
      setViewer(v);
    });
  }, []);
  useEffect(() => {
    if (!viewer) return;

    viewer.camera.on(viewer.renderer.getCanvas());
    prepareWorld(viewer.world);

    return () => {
      viewer?.world.destroy();
      viewer?.camera.off();
      viewer?.renderer.destroy();
    };
  }, [viewer]);
  useEffect(() => {
    if (!viewer) return;

    const loadModel = async () => {
      const { scene } = await Loader.load(model);

      onLoad?.(viewer);

      scene.traverse((object) => {
        // console.log(object);
      });

      const bb = new Box3().setFromObject(scene);
      scene.position.set(0, bb.min.y * -1, 0);
      bb.setFromObject(scene);

      await viewer.world.spawn([
        scene,
        // new Box3Helper(bb, '#dee2e6')
      ]);
      viewer.renderer.run();
      await viewer.camera.fitToBox(bb);
    };

    loadModel();
  }, [viewer, model]);
  useEffect(() => {
    if (!viewer) return;

    viewer.world.spawnGridHelper(
      30,
      30,
      isLight ? colors.gray[3] : colors.dark[4],
      isLight ? colors.gray[2] : colors.dark[6],
    );
  }, [viewer, isLight]);

  return {
    viewer,
    placeRef,
  };
}
