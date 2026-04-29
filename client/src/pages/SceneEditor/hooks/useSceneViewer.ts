import { useCallback, useEffect, useRef, useState } from 'react';
import type { SceneLightResponseDto, SceneResponseDto } from '@/app/api/dto.ts';
import { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import type { SelectionState } from './model.ts';
import type { AnimationClip, AnimationMixer } from 'three';

interface UseSceneViewerOptions {
  scene: SceneResponseDto | undefined;
}

export function useSceneViewer({ scene }: UseSceneViewerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loadedScene, setLoadedScene] = useState<SceneResponseDto | undefined>(undefined);
  const [selectionState, setSelectionState] = useState<SelectionState>(null);

  // Derived during render: any time the prop scene differs from the most recently loaded one,
  // we're mid-load. Avoids a synchronous setState inside the effect body.
  const isSceneLoading = !!viewer && !!scene && scene !== loadedScene;

  // init viewer
  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewerRef.current) return;

    const next = new Viewer(container);
    next.init().run();
    viewerRef.current = next;
    setViewer(next);

    return () => {
      next.destroy();
      viewerRef.current = null;
      setViewer(null);
    };
  }, []);

  // load scene when data is ready
  useEffect(() => {
    if (!viewer || !scene) return;

    let cancelled = false;

    viewer.loadScene(scene).then(() => {
      if (!cancelled) {
        setLoadedScene(scene);
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
            const attachTo = cfg.positional ? viewer.getSceneObjectGroup(obj.id) : undefined;
            viewer.playAudio(audioUrl, {
              loop: cfg.loop ?? false,
              volume: cfg.volume ?? 1,
              positional: cfg.positional ?? false,
              maxDistance: cfg.maxDistance,
              attachTo,
            });
          }
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [scene, viewer]);

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
    viewer,
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
