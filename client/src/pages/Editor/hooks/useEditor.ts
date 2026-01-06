import { MantineTheme, useSafeMantineTheme } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { Box3, Vector3 } from 'three';
import { useCurrentColorScheme } from '@/shared/hooks/useCurrentColorScheme.ts';
import { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';

export const addHelpers = (viewer: Viewer | null, isLight: boolean, { colors }: MantineTheme) => {
  if (!viewer) return;

  const defaultBoundingBox = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
  const boundingBox = viewer.model?.sceneBoundingBox ?? defaultBoundingBox;
  const boundingBoxLength = boundingBox.min.manhattanDistanceTo(boundingBox.max);

  const color1 = isLight ? colors.gray[4] : colors.dark[4];
  const color2 = isLight ? colors.gray[3] : colors.dark[6];

  viewer.world.spawnGridHelper(50, 50, color1, color2);
  viewer.world.spawnAxisHelper(Math.max(1.25, boundingBoxLength * 0.1));
  viewer.world.spawnGroundHelper(boundingBoxLength * 10, boundingBoxLength * 10);
  viewer.world.spawnSceneBoundingBoxHelper(boundingBox, color1);
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
    // console.log('# ===== Viewer world ===== #', viewer.world);
    viewer.camera.enableLayer([10]);
    queueMicrotask(() => setIsViewerLoading(false));
  }, [viewer, key, isLight, theme]);

  return {
    viewer,
    isViewerLoading,
    onViewerReady: useCallback((newViewer: Viewer) => {
      console.log(newViewer);
      setKey((prev) => ++prev);
      setViewer(() => newViewer);
    }, []),
  };
}
