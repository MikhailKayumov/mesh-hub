import { ActionIcon, Group, Skeleton, Title, Tooltip } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useModel3DContext } from '@/contexts/Model3DContext/useModel3DContext.ts';
import { RouterPaths } from '@/router/paths.ts';
import { useDocumentTitle } from '@/shared/hooks';
import { canNavigateBack } from '@/shared/utils/canNavigateBack.ts';
import { Model3DControls } from './components/Controls';
import { Model3DDownloadButton } from './components/DownloadButton';
import classes from './Model3DPageHeader.module.scss';

export function Model3DPageHeader() {
  const navigate = useNavigate();
  const model = useModel3DContext();

  useDocumentTitle(model?.name ?? '3D Модель');

  const onBack = () => navigate(canNavigateBack() ? -1 : (RouterPaths.Base as any));

  return (
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
  );
}
