import { Box, Drawer, LoadingOverlay, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetDisplayConfigQuery } from '@/app/api/display-config.ts';
import { useGetMaterialsQuery } from '@/app/api/materials.ts';
import { useModel3D } from '@/entities/model-3d';
import { Model3DContextProvider } from '@/shared/contexts/Model3DContext';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router.ts';
import { AnnotationManager } from '@/widgets/AnnotationManager';
import { Model3DViewer } from '@/widgets/Model3DViewer';
import type { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import { ReviewPanel } from '@/widgets/ReviewPanel';
import { VersionHistory } from '@/widgets/VersionHistory';
import { Model3DPageHeader } from './components/Header';
import { Model3DPageInfo } from './components/Info';
import { ReviewDrawerButtons } from './components/ReviewDrawerButtons';
import classes from './Model3DPage.module.scss';

// @refresh reset
export function Model3DPage() {
  const { id } = useParams<{ id: string }>();
  const { model3d, isModelLoading, model3dError } = useModel3D({ id });
  const { data: materialOverrides } = useGetMaterialsQuery({ modelId: id! }, { skip: !id });
  const { data: displayConfig } = useGetDisplayConfigQuery({ modelId: id! }, { skip: !id });
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [commentsOpened, { open: openComments, close: closeComments }] = useDisclosure(false);
  const [annotationsOpened, { open: openAnnotations, close: closeAnnotations }] = useDisclosure(false);
  const [versionsOpened, { open: openVersions, close: closeVersions }] = useDisclosure(false);
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
            displayConfig={displayConfig}
            materialOverrides={materialOverrides}
            onReady={(v) => {
              if (!v?.model?.sceneBoundingBox) return;

              const boundingBoxLength = v.model.sceneBoundingBox.min.manhattanDistanceTo(v.model.sceneBoundingBox.max);

              v.world.spawnGroundHelper(boundingBoxLength * 10, boundingBoxLength * 10, 0);
              setViewer(v);
              setIsViewerLoading(false);
            }}
          />
          <LoadingOverlay
            zIndex={10}
            className={classes['viewer-loader']}
            visible={isModelLoading || isViewerLoading}
          />
          {!isViewerLoading && (
            <ReviewDrawerButtons onComments={openComments} onAnnotations={openAnnotations} onVersions={openVersions} />
          )}
        </Box>
        <Model3DPageInfo />
      </Paper>

      <Drawer opened={commentsOpened} onClose={closeComments} title="Комментарии" position="right" size={380}>
        {id && <ReviewPanel modelId={id} viewer={viewer} />}
      </Drawer>

      <Drawer opened={annotationsOpened} onClose={closeAnnotations} title="Аннотации" position="right" size={380}>
        {id && <AnnotationManager modelId={id} viewer={viewer} canEdit={model3d?.isOwner ?? false} />}
      </Drawer>

      <Drawer opened={versionsOpened} onClose={closeVersions} title="История версий" position="right" size={400}>
        {id && <VersionHistory modelId={id} canEdit={model3d?.isOwner ?? false} viewer={viewer} />}
      </Drawer>
    </Model3DContextProvider>
  );
}
