import { useCallback, useEffect, useRef, useState } from 'react';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';

interface UseSceneViewerOptions {
  scene: SceneResponseDto | undefined;
}

export function useSceneViewer({ scene }: UseSceneViewerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // init viewer
  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewerRef.current) return;

    const viewer = new Viewer(container);
    viewer.init().run();
    viewerRef.current = viewer;
    setIsViewerReady(true);

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      setIsViewerReady(false);
    };
  }, []);

  // load scene when data is ready
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !scene || !isViewerReady) return;

    let cancelled = false;

    setIsSceneLoading(true);
    viewer.loadScene(scene).then(() => {
      if (!cancelled) {
        setIsSceneLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [scene, isViewerReady]);

  const selectObject = useCallback((sceneObjectId: string | null) => {
    setSelectedObjectId(sceneObjectId);
    viewerRef.current?.setSelectedObject(sceneObjectId);
  }, []);

  const captureScreenshot = useCallback((): string | null => {
    return viewerRef.current?.renderer.getScreenshot() ?? null;
  }, []);

  return {
    containerRef,
    viewer: viewerRef.current,
    isSceneLoading,
    selectedObjectId,
    selectObject,
    captureScreenshot,
  };
}
