import { Box, LoadingOverlay, Paper } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModel3D } from '@/entities/model-3d';
import { Model3DContextProvider } from '@/shared/contexts/Model3DContext';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router.ts';
import { Model3DViewer } from '@/widgets/Model3DViewer';
import { Model3DPageHeader } from './components/Header';
import { Model3DPageInfo } from './components/Info';
import classes from './Model3DPage.module.scss';

// @refresh reset
export function Model3DPage() {
  const { id } = useParams<{ id: string }>();
  const { model3d, isModelLoading, model3dError } = useModel3D({ id });
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!model3dError) return;
    navigate(buildAbsolutePath(RouterPaths.NotFound));
  }, [model3dError]);

  if (!isModelLoading && !model3d) {
    return null;
  }

  return (
    <Model3DContextProvider model={model3d}>
      <Model3DPageHeader />
      <Paper withBorder p={0} className={classes.content}>
        <Box className={classes['viewer-wrapper']}>
          <Model3DViewer
            model={model3d}
            onReady={(viewer) => {
              if (!viewer?.model?.sceneBoundingBox) return;

              const boundingBoxLength = viewer.model.sceneBoundingBox.min.manhattanDistanceTo(
                viewer.model.sceneBoundingBox.max,
              );

              viewer.world.spawnGroundHelper(boundingBoxLength * 10, boundingBoxLength * 10, 0);

              setIsViewerLoading(false);
            }}
          />
          <LoadingOverlay
            zIndex={10}
            className={classes['viewer-loader']}
            visible={isModelLoading || isViewerLoading}
          />
        </Box>
        <Model3DPageInfo />
      </Paper>
    </Model3DContextProvider>
  );
}
