import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnimationClip, AnimationMixer } from 'three';
import type { SceneLightResponseDto, SceneResponseDto } from '@/app/api/dto.ts';
import { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import type { SelectionState } from './model.ts';

interface UseSceneViewerOptions {
  scene: SceneResponseDto | undefined;
}

export function useSceneViewer({ scene }: UseSceneViewerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [isSceneLoading, setIsSceneLoading] = useState(false);
  const [selectionState, setSelectionState] = useState<SelectionState>(null);

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
        // Auto-play audio for scene objects that have autoplay configured
        for (const obj of scene.objects) {
          const cfg = obj.audioConfig as { audioId?: string; autoplay?: boolean; loop?: boolean; volume?: number } | null | undefined;
          if (cfg?.autoplay && cfg.audioId && obj.model.id) {
            const audioUrl = `/api/models-3d/${obj.model.id}/audio/${cfg.audioId}/stream`;
            viewer.playAudio(audioUrl, { loop: cfg.loop ?? false, volume: cfg.volume ?? 1 });
          }
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [scene, isViewerReady]);

  const selectObject = useCallback((sceneObjectId: string | null) => {
    setSelectionState(sceneObjectId ? { type: 'object', id: sceneObjectId } : null);
    viewerRef.current?.setSelectedObject(sceneObjectId);
  }, []);

  const selectLight = useCallback((lightId: string | null) => {
    setSelectionState(lightId ? { type: 'light', id: lightId } : null);
    viewerRef.current?.world.clearHighlight();
  }, []);

  const captureScreenshot = useCallback((): string | null => {
    return viewerRef.current?.renderer.getScreenshot() ?? null;
  }, []);

  const updateBackgroundColor = useCallback((hex: string) => {
    viewerRef.current?.world.setBackgroundColor(hex);
  }, []);

  const updateAmbientLight = useCallback((intensity: number) => {
    viewerRef.current?.world.setAmbientLight(intensity);
  }, []);

  const loadHdri = useCallback((url: string) => {
    viewerRef.current?.world.loadHdri(url);
  }, []);

  const syncLights = useCallback((lights: SceneLightResponseDto[]) => {
    viewerRef.current?.world.syncLights(lights);
  }, []);

  const getObjectAnimations = useCallback((sceneObjectId: string): AnimationClip[] => {
    return viewerRef.current?.getObjectAnimations(sceneObjectId) ?? [];
  }, []);

  const getObjectMixer = useCallback((sceneObjectId: string): AnimationMixer | undefined => {
    return viewerRef.current?.getObjectMixer(sceneObjectId);
  }, []);

  const getAnimatedObjectIds = useCallback((): string[] => {
    return viewerRef.current?.getSceneObjectMixerIds() ?? [];
  }, []);

  return {
    containerRef,
    viewer: viewerRef.current,
    isSceneLoading,
    selectionState,
    selectObject,
    selectLight,
    captureScreenshot,
    updateBackgroundColor,
    updateAmbientLight,
    loadHdri,
    syncLights,
    getObjectAnimations,
    getObjectMixer,
    getAnimatedObjectIds,
  };
}
