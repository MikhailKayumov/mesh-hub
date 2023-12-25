import { useEffect, useRef, useState } from 'react';
import { Box3, Box3Helper } from 'three/src/Three.js';
import { Model3DResponseDto } from '@/api/dto.ts';
import { run } from '@/components/Viewer/classes';
import { loadModel3D } from '@/components/Viewer/classes/loader';
import { Viewer } from '@/components/Viewer/classes/types';

export interface UseViewerProps {
  model: Model3DResponseDto;
  onInit?: (viewer: Viewer) => void;
  onLoad?: (viewer: Viewer) => void;
  onSaveThumbnail?: (thumbnail: string) => void;
}

export default function useViewer({ model, onLoad }: UseViewerProps) {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const placeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placeRef.current) {
      console.warn('Place for rendering was not found');
      return;
    }

    run(placeRef.current).then((v) => {
      setViewer(v);
    });
  }, []);
  useEffect(() => {
    if (!viewer) return;

    viewer.renderer.run();
    viewer.camera.on(viewer.renderer.getCanvas());

    console.log(viewer?.renderer.getInfo());

    return () => {
      viewer?.world.destroy();
      viewer?.camera.off();

      console.log(viewer?.renderer.getInfo());

      viewer?.renderer.destroy();
    };
  }, [viewer]);
  useEffect(() => {
    if (!viewer) return;

    const loadModel = async () => {
      const model3d: any = await loadModel3D(model);

      onLoad?.(viewer);

      const bb = new Box3().setFromObject(model3d);
      model3d.position.set(0, bb.min.y * -1, 0);
      bb.setFromObject(model3d);

      const bbh = new Box3Helper(bb, '#dee2e6');

      await viewer.world.spawn([model3d, bbh]);
      await viewer.camera.fitToBox(bb);
    };

    loadModel();
  }, [viewer, model]);

  return {
    viewer,
    placeRef,
  };
}
