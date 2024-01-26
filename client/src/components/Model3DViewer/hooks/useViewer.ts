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
      await viewer.world.prepare(viewer.model?.sceneBoundingBox);
      await viewer.run(onReady);
    };

    run();

    return () => {};
  }, [viewer, model?.file.id]);

  return {
    placeRef,
    viewer,
  };
}
