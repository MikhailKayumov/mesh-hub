import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconHome, IconPhotoSensor } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useSaveThumbnailFromBase64Mutation } from '@/app/api/models-3d.ts';
import { AppRegexp } from '@/shared/constants';
import { sleep } from '@/shared/utils/sleep.ts';
import { useViewerContext } from '../../hooks/useViewerContext.ts';
import classes from './TopBar.module.scss';

export function Model3DViewerTopBar() {
  const viewer = useViewerContext();
  const [resetCameraTargetPosition, setResetCameraTargetPosition] = useState(new Vector3());
  const [isCameraResetting, setIsCameraResetting] = useState(false);
  const [saveThumbnailFromBase64, { isLoading: isThumbnailSaving }] = useSaveThumbnailFromBase64Mutation();

  useEffect(() => {
    if (!viewer) return;

    if (viewer.model?.sceneBoundingBox.isBox3) {
      const maxY = viewer.model.sceneBoundingBox.max.y;
      const minY = viewer.model.sceneBoundingBox.min.y;
      if (maxY !== undefined && minY !== undefined) {
        queueMicrotask(() => setResetCameraTargetPosition(new Vector3(0, (maxY - minY) / 2, 0)));
      }
    }
  }, [viewer?.model?.sceneBoundingBox]);

  const saveThumbnail = async () => {
    if (!viewer || !viewer.model || !viewer.model.data.isOwner) return;

    await sleep(0.05);
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
  const resetCameraPosition = async () => {
    setIsCameraResetting(() => true);
    await viewer?.camera.control?.moveTo(
      resetCameraTargetPosition.x,
      resetCameraTargetPosition.y,
      resetCameraTargetPosition.z,
      true,
    );
    setIsCameraResetting(() => false);
  };

  return (
    <Group className={classes.root} justify="flex-start" gap={6}>
      {viewer?.model?.data.isOwner && (
        <Tooltip label="Сохранить портрет" position="top-start" offset={1} openDelay={1100}>
          <ActionIcon loading={isThumbnailSaving} className={classes.action} onClick={saveThumbnail}>
            <IconPhotoSensor className={classes['action-icon']} />
          </ActionIcon>
        </Tooltip>
      )}
      <Tooltip label="Сбросить положение камеры" position="top-start" offset={1} openDelay={1100}>
        <ActionIcon loading={isCameraResetting} className={classes.action} onClick={resetCameraPosition}>
          <IconHome className={classes['action-icon']} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
