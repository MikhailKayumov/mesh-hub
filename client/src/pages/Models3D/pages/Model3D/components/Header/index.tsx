import { ActionIcon, Group, Skeleton, Title, Tooltip } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import Model3DControls from '@/components/Model3DControls';
import Model3DDownloadButton from '@/components/Model3DDownloadButton';
import useModel3DContext from '@/contexts/Model3DContext/useModel3DContext.ts';
import classes from '@/pages/Models3D/pages/Model3D/Model3DPage.module.scss';
import RouterPaths from '@/router/paths.ts';
import canNavigateBack from '@/utils/canNavigateBack.ts';

export default function Model3DPageHeader() {
  const { model } = useModel3DContext();
  const navigate = useNavigate();

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
