import { useSafeMantineTheme } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { Model3DResponseDto } from '@/api/dto.ts';
import { Viewer } from '../classes/Viewer';

export interface UseViewerProps {
  model: Model3DResponseDto | null;
  onInit?: (viewer: Viewer) => void | Promise<void>;
  onReady?: (viewer: Viewer) => void | Promise<void>;
  onDestroy?: (viewer?: Viewer) => void | Promise<void>;
}

// @refresh reset
export default function useViewer({ model, onReady, onInit, onDestroy }: UseViewerProps) {
  const placeRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const theme = useSafeMantineTheme();

  // init viewer
  useEffect(() => {
    if (!placeRef.current) {
      console.warn('Place for rendering was not found');
      return;
    }

    const v: Viewer = (viewer ?? new Viewer()).setPlace(placeRef.current).init();
    if (!viewer) {
      setViewer(v);
    }

    onInit?.(v);

    return () => {
      onDestroy?.(v);
      v?.destroy();
    };
  }, []);
  // run viewer
  useEffect(() => {
    if (!viewer || !model) return;

    const run = async () => {
      await viewer.loadModel(model);

      viewer.camera.camera.layers.enable(1);
      viewer.camera.camera.layers.enable(2);
      viewer.camera.camera.layers.enable(3);

      await viewer.run(onReady);
    };

    run();
  }, [viewer, model?.file.id]);
  // spawn helpers
  useEffect(() => {
    if (!viewer) return;

    // viewer.world.spawnGridHelper(50, 50, theme.colors.dark[4], theme.colors.dark[6]);
    viewer.world.spawnAxisHelper(1.25);
    viewer.world.spawnGroundHelper(theme.colors.dark[7], 1500, 1500, 150, 150);

    if (viewer?.model?.sceneBoundingBox) {
      // viewer.world.spawnSceneBoundingBoxHelper(viewer.model.sceneBoundingBox, theme.colors.dark[1]);
    }
  }, [viewer, theme]);

  return {
    placeRef,
    viewer,
  };
}
