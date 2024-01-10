import { ActionIcon, Box, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhotoSensor } from '@tabler/icons-react';
import { useSaveThumbnailFromBase64Mutation } from '@/api/models-3d.ts';
import { AppRegexp } from '@/constants';
import useViewerContext from '../../hooks/useViewerContext.ts';
import classes from './TopBar.module.scss';

export default function Model3DViewerTopBar() {
  const viewer = useViewerContext();
  const [saveThumbnailFromBase64, { isLoading: isThumbnailSaving }] = useSaveThumbnailFromBase64Mutation();

  const saveThumbnail = async () => {
    if (!viewer || !viewer.model || !viewer.model.data.isOwner) return;

    const base64 = viewer.renderer.getScreenshot();
    const decodedData = base64.replace(/^data:image\/png;base64,/, '');
    if (!AppRegexp.Base64.test(decodedData)) return;

    try {
      await saveThumbnailFromBase64({ id: viewer.model.data.id, thumbnail: base64 }).unwrap();
      notifications.show({ message: 'Портрет успешно сохранен', color: 'green', autoClose: 3000 });
    } catch (e) {
      notifications.show({
        title: 'Ошибка',
        message: (e as any)?.message ?? 'Не удалось сохранить портрет',
        color: 'red',
        autoClose: 10000,
      });
    }
  };

  return (
    <Box className={classes.root}>
      {viewer?.model?.data.isOwner && (
        <Tooltip label="Сохранить портрет" position="top-start" offset={1} openDelay={1100}>
          <ActionIcon loading={isThumbnailSaving} className={classes.action} onClick={saveThumbnail}>
            <IconPhotoSensor className={classes['action-icon']} />
          </ActionIcon>
        </Tooltip>
      )}
    </Box>
  );
}
