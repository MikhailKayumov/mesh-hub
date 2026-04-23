import { useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useModelAnnotationsQuery } from '@/app/api/reviews.ts';
import type { ViewerMode } from '../classes/types';
import type { Viewer } from '../classes/Viewer';

export interface PendingPlacement {
  worldPos: Vector3;
  cameraPos: Vector3;
  mode: ViewerMode;
}

export function useViewerReviews(viewer: Viewer | null, modelId: string) {
  const { data: annotations } = useModelAnnotationsQuery({ modelId }, { skip: !modelId });
  const [pending, setPending] = useState<PendingPlacement | null>(null);

  // Sync annotation markers into the viewer scene
  useEffect(() => {
    if (!viewer) return;
    viewer.world.clearMarkers();
    if (!annotations) return;
    for (const ann of annotations) {
      viewer.world.spawnMarker(ann.id, new Vector3(ann.pos.x, ann.pos.y, ann.pos.z));
    }
  }, [viewer, annotations]);

  function startPlacement(mode: 'comment' | 'annotate') {
    if (!viewer) return;
    viewer.setMode(mode);
    viewer.onScenePointerDown((worldPos, cameraPos) => {
      setPending({ worldPos, cameraPos, mode });
    });
  }

  function clearPending() {
    setPending(null);
    viewer?.setMode('view');
  }

  return { pending, clearPending, startPlacement, annotations };
}
