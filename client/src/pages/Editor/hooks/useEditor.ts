import { MantineTheme, useSafeMantineTheme } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { Box3, Vector3 } from 'three';
import { Viewer } from '@/components/Model3DViewer/classes/Viewer';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';

export const addHelpers = (viewer: Viewer | null, isLight: boolean, { colors }: MantineTheme) => {
  if (!viewer) return;

  const defaultBoundingBox = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
  const boundingBox = viewer.model?.sceneBoundingBox ?? defaultBoundingBox;
  const boundingBoxLength = boundingBox.min.manhattanDistanceTo(boundingBox.max);

  const color1 = isLight ? colors.gray[4] : colors.dark[4];
  const color2 = isLight ? colors.gray[3] : colors.dark[6];

  viewer.world.spawnGridHelper(500, 50, color1, color2);
  viewer.world.spawnAxisHelper(Math.max(1.25, boundingBoxLength * 0.1));
  viewer.world.spawnGroundHelper(boundingBoxLength * 10, boundingBoxLength * 10, 1);
  viewer.world.spawnSceneBoundingBoxHelper(boundingBox, color1, 5);
};

export function useEditor() {
  const theme = useSafeMantineTheme();
  const { isLight } = useCurrentColorScheme();

  const [key, setKey] = useState(0);
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  // spawn helpers
  useEffect(() => {
    if (!viewer) return;

    addHelpers(viewer, isLight, theme);
    setIsViewerLoading(false);

    const onCameraUpdate = (e: any) => {
      console.log(e.target.distance);
      console.log(viewer.world.helpers.grid);
      if (viewer.world.helpers.grid) {
        viewer.world.helpers.grid.scale.set(5, 5, 5);
      }
    };

    viewer.camera.control?.addEventListener('control', onCameraUpdate);

    return () => {
      viewer.camera.control?.removeEventListener('control', onCameraUpdate);
    };
  }, [viewer, key, isLight]);

  return {
    viewer,
    isViewerLoading,
    onViewerReady: useCallback((newViewer: Viewer) => {
      setKey((prev) => ++prev);
      setViewer(() => newViewer);
    }, []),
  };
}
