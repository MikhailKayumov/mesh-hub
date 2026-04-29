import { useCallback, useEffect, useRef, useState } from 'react';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';

interface UsePublicSceneViewerOptions {
  scene: SceneResponseDto | undefined;
}

/**
 * Read-only counterpart of `useSceneViewer` (editor) for the public scene page.
 *
 * Mounts a `Viewer` into a container ref, loads the scene when data is ready,
 * and exposes a minimal `selectObject` helper used by annotation cards to
 * highlight the linked scene object. No transform controls, no edit callbacks.
 */
export function usePublicSceneViewer({ scene }: UsePublicSceneViewerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(false);

  // init viewer
  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewerRef.current) return;

    const next = new Viewer(container);
    next.init().run();
    viewerRef.current = next;
    setViewer(next);
    setIsViewerReady(true);

    return () => {
      next.destroy();
      viewerRef.current = null;
      setViewer(null);
      setIsViewerReady(false);
    };
  }, []);

  // load scene when data is ready
  useEffect(() => {
    const v = viewerRef.current;
    if (!v || !scene || !isViewerReady) return;

    let cancelled = false;
    setIsSceneLoading(true);
    v.loadScene(scene).then(() => {
      if (cancelled) return;
      setIsSceneLoading(false);
      // Auto-play audio for scene objects that have autoplay configured
      for (const obj of scene.objects) {
        const cfg = obj.audioConfig as
          | {
              audioId?: string;
              autoplay?: boolean;
              loop?: boolean;
              volume?: number;
              positional?: boolean;
              maxDistance?: number;
            }
          | null
          | undefined;
        if (cfg?.autoplay && cfg.audioId && obj.model.id) {
          const audioUrl = `/api/models-3d/${obj.model.id}/audio/${cfg.audioId}/stream`;
          const attachTo = cfg.positional ? v.getSceneObjectGroup(obj.id) : undefined;
          v.playAudio(audioUrl, {
            loop: cfg.loop ?? false,
            volume: cfg.volume ?? 1,
            positional: cfg.positional ?? false,
            maxDistance: cfg.maxDistance,
            attachTo,
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [scene, isViewerReady]);

  const selectObject = useCallback((sceneObjectId: string | null) => {
    viewerRef.current?.setSelectedObject(sceneObjectId);
  }, []);

  return {
    containerRef,
    viewer,
    isSceneLoading,
    selectObject,
  };
}
