import {
  ActionIcon,
  Box,
  Group,
  LoadingOverlay,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
  useSafeMantineTheme,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotFoundError } from '@/components/Errors';
import Model3DControls from '@/components/Model3DControls';
import Model3DDownloadButton from '@/components/Model3DDownloadButton';
import Viewer from '@/components/Viewer';
import { Model3DContextProvider } from '@/contexts/Model3DContext';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';
import useModel3D from '@/pages/Models3D/Model3D/useModel3D.ts';
import RouterPaths from '@/router/paths.ts';
import canNavigateBack from '@/utils/canNavigateBack.ts';
import classes from './Model3DPage.module.scss';

export default function Model3DPage() {
  const navigate = useNavigate();
  const [modelFileLoading, setModelFileLoading] = useState(true);

  const { model, isModelLoading, saveThumbnailBase64 } = useModel3D();

  const { isLight } = useCurrentColorScheme();
  const { colors } = useSafeMantineTheme();

  if (!isModelLoading && !model) return <NotFoundError />;

  const onBack = () => {
    navigate(canNavigateBack() ? -1 : (RouterPaths.Base as any));
  };

  return (
    <Model3DContextProvider model={model}>
      <Group mb="lg" align="center" justify="space-between" wrap="nowrap" h={46} gap={32}>
        <Group gap={12} align="center" wrap="nowrap" className={classes['model-name-title']}>
          <Tooltip label="Назад" position="bottom-start" openDelay={1000} offset={1}>
            <ActionIcon variant="subtle" onClick={onBack} miw={38} mih={38} maw={38} mah={38}>
              <IconArrowLeft />
            </ActionIcon>
          </Tooltip>
          <Skeleton visible={!model} className={classes['model-name-title-skeleton']}>
            <Title lineClamp={1} className={classes['model-name-title-text']}>
              <Tooltip label={model?.name} position="bottom-start">
                <span>{model?.name}</span>
              </Tooltip>
            </Title>
          </Skeleton>
        </Group>

        {model && <>{model.isOwner ? <Model3DControls /> : <Model3DDownloadButton />}</>}
      </Group>
      <Paper withBorder p={0} className={classes.content}>
        <Box className={classes['viewer-wrapper']}>
          {model && (
            <Viewer model={model} onLoad={() => setModelFileLoading(false)} onSaveThumbnail={saveThumbnailBase64} />
          )}
          <LoadingOverlay
            visible={isModelLoading || modelFileLoading}
            zIndex={10}
            overlayProps={{
              color: isLight ? colors.gray[0] : colors.dark[7],
              backgroundOpacity: 0.75,
              blur: 6,
            }}
          />
        </Box>

        <Stack gap={6} p={24}>
          <Title order={5}>Описание</Title>
          <Skeleton visible={isModelLoading}>
            {model?.description ? <Text>{model.description}</Text> : <Text c="dimmed">Описание отсутствует</Text>}
          </Skeleton>
        </Stack>
      </Paper>
    </Model3DContextProvider>
  );
}
