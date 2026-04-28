import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DisplayConfigResponseDto, MaterialOverrideResponseDto, Model3DResponseDto } from '@/app/api/dto.ts';
import { getModel3DVersionFileSrc } from '@/shared/utils/model3d.ts';
import { sleep } from '@/shared/utils/sleep.ts';
import { Viewer } from '../classes/Viewer';
import type { PostProcessConfig } from '../classes/types';

export interface UseViewerProps {
  model: Model3DResponseDto | null;
  displayConfig?: DisplayConfigResponseDto | null;
  materialOverrides?: MaterialOverrideResponseDto[] | null;
  onInit?: (viewer: Viewer) => void | Promise<void>;
  onReady?: (viewer: Viewer) => void | Promise<void>;
  onDestroy?: (viewer?: Viewer) => void | Promise<void>;
}

export function useViewer({ model, displayConfig, materialOverrides, onReady, onInit, onDestroy }: UseViewerProps) {
  const placeRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [searchParams] = useSearchParams();

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

    const versionId = searchParams.get('versionId');

    const run = async () => {
      if (viewer.model?.data?.id === model.id && !versionId) return;

      viewer.camera.enableLayer(1);
      viewer.world.destroy();

      if (versionId) {
        const fileName = model.file.entryFile || model.file.name;
        const url = getModel3DVersionFileSrc(model.id, versionId, fileName);
        await viewer.loadFile(url);
      } else {
        await viewer.loadModel(model);
      }

      await viewer.world.prepare(viewer.model?.sceneBoundingBox);

      // Apply display config after world prepare, before run
      if (displayConfig) {
        viewer.world.setBackgroundColor(displayConfig.backgroundColor);
        viewer.world.setAmbientLight(displayConfig.ambientIntensity);
        viewer.world.setFog({
          enabled: displayConfig.fogEnabled,
          type: displayConfig.fogType as 'linear' | 'exp2',
          color: displayConfig.fogColor,
          near: displayConfig.fogNear,
          far: displayConfig.fogFar,
        });
        if (displayConfig.lights?.length) {
          viewer.world.syncLights(displayConfig.lights as any);
        }
        if (displayConfig.rendererConfig) {
          viewer.renderer.setSettings(displayConfig.rendererConfig);
        }
        if (displayConfig.postProcess) {
          viewer.renderer.setPostProcessing(displayConfig.postProcess as PostProcessConfig);
        }
      }

      if (materialOverrides?.length) {
        viewer.world.applyMaterialOverrides(materialOverrides);
      }

      await viewer.run();

      viewer.model?.sceneBoundingBox && (await viewer.camera.moveToInitPosition(viewer.model.sceneBoundingBox));

      await onReady?.(viewer);
      await sleep(0.1);

      viewer.model?.sceneBoundingBox && (await viewer.camera.fitToBox(viewer.model.sceneBoundingBox));
    };

    run();

    return () => {};
  }, [viewer, model?.id, searchParams.get('versionId')]);

  return {
    placeRef,
    viewer,
  };
}


export function useViewer({ model, onReady, onInit, onDestroy }: UseViewerProps) {
  const placeRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [searchParams] = useSearchParams();

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

    const versionId = searchParams.get('versionId');

    const run = async () => {
      if (viewer.model?.data?.id === model.id && !versionId) return;

      viewer.camera.enableLayer(1);
      viewer.world.destroy();

      if (versionId) {
        const fileName = model.file.entryFile || model.file.name;
        const url = getModel3DVersionFileSrc(model.id, versionId, fileName);
        await viewer.loadFile(url);
      } else {
        await viewer.loadModel(model);
      }

      await viewer.world.prepare(viewer.model?.sceneBoundingBox);
      await viewer.run();

      viewer.model?.sceneBoundingBox && (await viewer.camera.moveToInitPosition(viewer.model.sceneBoundingBox));

      await onReady?.(viewer);
      await sleep(0.1);

      viewer.model?.sceneBoundingBox && (await viewer.camera.fitToBox(viewer.model.sceneBoundingBox));
    };

    run();

    return () => {};
  }, [viewer, model?.id, searchParams.get('versionId')]);

  return {
    placeRef,
    viewer,
  };
}
