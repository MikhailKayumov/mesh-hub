import { Box, LoadingOverlay, Paper } from '@mantine/core';
import { useState } from 'react';
import { NotFoundError } from '@/components/Errors';
import { Model3DContextProvider } from '@/contexts/Model3DContext';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import Modal3DPageDescription from './components/Description';
import Model3DPageHeader from './components/Header';
import Model3DPageViewer from './components/Viewer';
import classes from './Model3DPage.module.scss';
import useModel3DData from './useModel3DData';

export default function Model3DPage() {
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const data = useModel3DData();

  useDocumentTitle(data.model?.name ?? '3D Модель');

  if (!data.isModelLoading && !data.model) {
    return <NotFoundError />;
  }

  return (
    <Model3DContextProvider model={data}>
      <Model3DPageHeader />
      <Paper withBorder p={0} className={classes.content}>
        <Box className={classes['viewer-wrapper']}>
          <Model3DPageViewer onLoad={() => setIsViewerLoading(false)} />
          <LoadingOverlay
            zIndex={10}
            className={classes['viewer-loader']}
            visible={data.isModelLoading || isViewerLoading}
          />
        </Box>
        <Modal3DPageDescription />
      </Paper>
    </Model3DContextProvider>
  );
}
