import { useEffect, useRef, useState } from 'react';
import type { Model3DResponseDto } from '@/app/api/dto.ts';
import { sleep } from '@/shared/utils/sleep.ts';
import { Viewer } from '../classes/Viewer';

export interface UseViewerProps {
  model: Model3DResponseDto | null;
  onInit?: (viewer: Viewer) => void | Promise<void>;
  onReady?: (viewer: Viewer) => void | Promise<void>;
  onDestroy?: (viewer?: Viewer) => void | Promise<void>;
}

export function useViewer({ model, onReady, onInit, onDestroy }: UseViewerProps) {
  const placeRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  // init viewer
  useEffect(() => {
    if (!placeRef.current) {
      console.warn('Place for rendering was not found');
      return;
    }

    const v: Viewer = (viewer ?? new Viewer()).setPlace(placeRef.current).init();
    if (!viewer) setViewer(v);

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
      if (viewer.model?.data.id === model.id) return;

      viewer.camera.enableLayer(1);
      viewer.world.destroy();
      await viewer.loadModel(model);
      await viewer.world.prepare(viewer.model?.sceneBoundingBox);
      await viewer.run();

      viewer.model?.sceneBoundingBox && (await viewer.camera.moveToInitPosition(viewer.model.sceneBoundingBox));

      await onReady?.(viewer);
      await sleep(0.1);

      viewer.model?.sceneBoundingBox && (await viewer.camera.fitToBox(viewer.model.sceneBoundingBox));
    };

    run();

    return () => {};
  }, [viewer, model?.id]);

  return {
    placeRef,
    viewer,
  };
}
