import { ActionIcon, Box, Flex, Group, Loader, LoadingOverlay, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useState } from 'react';
import { NotFoundError } from '@/components/Errors';
import Model3DControls from '@/components/Model3DControls';
import Model3DDownloadButton from '@/components/Model3DDownloadButton';
import Viewer from '@/components/Viewer';
import useModel3D from '@/pages/Models/Model/useModel3D.ts';
import classes from './Model3DPage.module.scss';

export default function Model3DPage() {
  const { model, isModelLoading, isModelError, onBack, saveThumbnailBase64 } = useModel3D();
  const [modelFileLoading, setModelFileLoading] = useState(true);

  if (isModelLoading) {
    return (
      <Flex align="center" justify="center" style={{ flex: 1 }}>
        <Loader />
      </Flex>
    );
  }
  if (isModelError || !model) return <NotFoundError />;

  return (
    <>
      <Group mb="lg" align="center" justify="space-between">
        <Group gap={8} align="center">
          <ActionIcon variant="subtle" onClick={onBack}>
            <IconArrowLeft />
          </ActionIcon>
          <Title>{model.name}</Title>
        </Group>
        {model.isOwner ? (
          <Model3DControls id={model.id} file={model.file} />
        ) : (
          <Model3DDownloadButton file={model.file} />
        )}
      </Group>
      <Paper withBorder p={24} className={classes.content}>
        <Stack gap={24}>
          <Box className={classes['viewer-wrapper']}>
            <Viewer
              model={model}
              onLoad={() => setModelFileLoading(false)}
              onSaveThumbnail={(thumbnail) => {
                saveThumbnailBase64({
                  id: model.id,
                  thumbnail,
                });
              }}
            />
            <LoadingOverlay visible={modelFileLoading} zIndex={1000} overlayProps={{ blur: 2 }} />
          </Box>
          <Stack gap={6}>
            <Title order={4}>Описание</Title>
            {model.description ? <Text>{model.description}</Text> : <Text c="dimmed">Описание отсутствует</Text>}
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
