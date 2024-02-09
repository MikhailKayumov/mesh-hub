import { Box, LoadingOverlay, Paper } from '@mantine/core';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { NotFoundError } from '@/components/Errors';
import { Model3DViewer } from '@/components/Model3DViewer';
import { Model3DContextProvider } from '@/contexts/Model3DContext';
import { useModel3D } from '@/hooks/useModel3D.ts';
import { Model3DPageHeader } from './components/Header';
import { Model3DPageInfo } from './components/Info';
import classes from './Model3DPage.module.scss';

// @refresh reset
export function Model3DPage() {
  const { id } = useParams<{ id: string }>();
  const { model3d, isModelLoading } = useModel3D({ id });
  const [isViewerLoading, setIsViewerLoading] = useState(true);

  if (!isModelLoading && !model3d) {
    return <NotFoundError />;
  }

  return (
    <Model3DContextProvider model={model3d}>
      <Model3DPageHeader />
      <Paper withBorder p={0} className={classes.content}>
        <Box className={classes['viewer-wrapper']}>
          <Model3DViewer model={model3d} onReady={() => setIsViewerLoading(false)} />
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
