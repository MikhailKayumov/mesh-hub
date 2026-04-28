import { Box, Text } from '@mantine/core';
import { useParams, useSearchParams } from 'react-router-dom';
import { useGetDisplayConfigQuery } from '@/app/api/display-config.ts';
import { useEmbedViewerQuery } from '@/app/api/embed.ts';
import { useGetMaterialsQuery } from '@/app/api/materials.ts';
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
  const { data: displayConfig } = useGetDisplayConfigQuery({ modelId: modelId! }, { skip: !modelId });
  const { data: materialOverrides } = useGetMaterialsQuery({ modelId: modelId! }, { skip: !modelId });

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

  const { brandingConfig } = data;

  return (
    <Box className={classes.root}>
      <Model3DViewer model={data.model} displayConfig={displayConfig} materialOverrides={materialOverrides} />
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
