import { Box, Text } from '@mantine/core';
import { useParams, useSearchParams } from 'react-router-dom';
import { useGetDisplayConfigQuery } from '@/app/api/display-config.ts';
import { useEmbedViewerQuery } from '@/app/api/embed.ts';
import { useGetMaterialsQuery } from '@/app/api/materials.ts';
import { usePublicSceneViewer } from '@/pages/PublicScene/hooks/usePublicSceneViewer.ts';
import { Model3DViewer } from '@/widgets/Model3DViewer';
import classes from './EmbedViewerPage.module.scss';

export function EmbedViewerPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const [searchParams] = useSearchParams();
  const apiKey = searchParams.get('apiKey') ?? '';

  const { data, isLoading, isError } = useEmbedViewerQuery(
    { modelId: modelId!, apiKey },
    { skip: !modelId || !apiKey },
  );

  const isModel = data?.type === 'model';
  const modelEntityId = isModel ? data?.model?.id : undefined;

  const { data: displayConfig } = useGetDisplayConfigQuery({ modelId: modelEntityId! }, { skip: !modelEntityId });
  const { data: materialOverrides } = useGetMaterialsQuery({ modelId: modelEntityId! }, { skip: !modelEntityId });

  const { containerRef } = usePublicSceneViewer({
    scene: data?.type === 'scene' ? data.scene : undefined,
  });

  if (!apiKey || isError) {
    return (
      <Box className={classes.root}>
        <Text c="dimmed" ta="center">
          Failed to load embed viewer
        </Text>
      </Box>
    );
  }

  if (isLoading || !data) {
    return <Box className={classes.root} />;
  }

  if (data.type === 'model' && !data.model) {
    return <Box className={classes.root} />;
  }

  if (data.type === 'scene' && !data.scene) {
    return <Box className={classes.root} />;
  }

  const { brandingConfig } = data;

  return (
    <Box className={classes.root}>
      {data.type === 'model' && data.model && (
        <Model3DViewer model={data.model} displayConfig={displayConfig} materialOverrides={materialOverrides} />
      )}
      {data.type === 'scene' && data.scene && <Box ref={containerRef} className={classes.sceneCanvas} />}
      {brandingConfig?.showBadge && (
        <Box className={classes.badge}>
          <Text size="xs" c="dimmed">
            Powered by MeshHub
          </Text>
        </Box>
      )}
    </Box>
  );
}
