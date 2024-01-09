import { ActionIcon, Box, Tooltip } from '@mantine/core';
import { IconPhotoSensor } from '@tabler/icons-react';
import classes from '@/pages/Models3D/pages/Model3D/components/Model3DViewer/Viewer.module.scss';
// import { useSaveThumbnailFromBase64Mutation } from '@/api/models-3d.ts';
// import { AppRegexp } from '@/constants';
// import { notifications } from '@mantine/notifications';

export default function TopBar() {
  // const [saveThumbnailFromBase64, { isLoading: isThumbnailSaving }] = useSaveThumbnailFromBase64Mutation();

  // const saveThumbnail = async (base64: string) => {
  //   if (!data || !base64) return;
  //
  //   const decodedData = base64.replace(/^data:image\/png;base64,/, '');
  //   if (!AppRegexp.Base64.test(decodedData)) return;
  //
  //   try {
  //     await saveThumbnailFromBase64({ id: data.id, thumbnail: base64 }).unwrap();
  //     notifications.show({ message: 'Портрет успешно сохранен', color: 'green', autoClose: 3000 });
  //   } catch (e) {
  //     notifications.show({
  //       title: 'Ошибка',
  //       message: (e as any)?.message ?? 'Не удалось сохранить портрет',
  //       color: 'red',
  //       autoClose: 10000,
  //     });
  //   }
  // };

  const onSaveThumbnail = () => {
    // if (!viewer || !saveThumbnail) return;
    // saveThumbnail(viewer.renderer.getScreenshot());
  };

  return (
    <Box className={classes.controls}>
      <Tooltip label="Сохранить портрет" position="top-start" offset={1} openDelay={1100}>
        <ActionIcon
          // loading={isThumbnailSaving}
          className={classes['controls-action']}
          onClick={onSaveThumbnail}
        >
          <IconPhotoSensor className={classes['controls-action-icon']} />
        </ActionIcon>
      </Tooltip>
    </Box>
  );
}
