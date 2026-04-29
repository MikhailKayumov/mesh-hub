import { Alert, Button, Group, Modal, Progress, rem, Stack, Text, Tooltip } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconCubePlus, IconInfoCircle, IconUpload } from '@tabler/icons-react';
import { type FileRejection } from 'react-dropzone-esm';
import { useCurrentColorScheme } from '@/shared/hooks/useCurrentColorScheme.ts';
import { formatBytes } from '@/shared/utils/format-bytes.ts';
import { ACCEPTED_3D_MODEL_FILE_TYPES, MAX_3D_MODEL_FILE_SIZE } from '../../shared/constants';
import classes from './Upload3DModelModal.module.scss';
import { useUpload3DModal } from './useUpload3DModal.ts';
import { validate3DModelFile } from './validate3DModelFile.ts';

const PROGRESS_THRESHOLD_BYTES = 10 * 1024 * 1024;

const onReject = (fileRejections: FileRejection[]) => {
  const msg = fileRejections?.[0]?.errors?.[0]?.message;

  notifications.show({
    title: 'Ошибка',
    message: msg || 'Проверьте формат и размер файла.',
    color: 'red',
    autoClose: 10000,
  });
};

interface Upload3DModelModalProps {
  initialFile?: File;
}

export function Upload3DModelModal({ initialFile }: Upload3DModelModalProps = {}) {
  const { isDark } = useCurrentColorScheme();
  const { opened, model, isLoading, uploadProgress, error, open, close, setModel, onUpload } =
    useUpload3DModal(initialFile);

  const showProgress =
    !!model && model.size > PROGRESS_THRESHOLD_BYTES && uploadProgress > 0 && uploadProgress < 100 && !error;
  const showObjTip = !!model && model.name.toLowerCase().endsWith('.obj');

  return (
    <>
      <Button onClick={open} leftSection={<IconUpload size={18} />}>
        Загрузить модель
      </Button>
      <Modal
        centered
        opened={opened}
        size="md"
        padding={24}
        onClose={close}
        title="Загрузка 3D модели"
        className={classes.root}
        closeOnClickOutside={!isLoading}
        closeOnEscape={!isLoading}
        closeButtonProps={{ disabled: isLoading }}
      >
        <Dropzone
          preventDropOnDocument={true}
          disabled={isLoading}
          multiple={false}
          accept={ACCEPTED_3D_MODEL_FILE_TYPES}
          onDrop={(files) => setModel(files[0])}
          onReject={onReject}
          validator={validate3DModelFile}
          className={classes.dropzone}
        >
          <Stack align="center" justify="center" gap={12}>
            <Dropzone.Idle>
              <IconCubePlus
                style={{
                  width: rem(62),
                  height: rem(62),
                  color: isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)',
                }}
                stroke={1.5}
              />
            </Dropzone.Idle>
            <Dropzone.Accept>
              <IconUpload
                style={{ width: rem(62), height: rem(62), color: 'var(--mantine-color-primary-6)' }}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Text size="md" c={isDark ? 'gray.3' : 'gray.8'} ta="center" lh={rem(22)}>
              Переместите 3D модель сюда или
              <br />
              нажмите чтобы выбрать файл
            </Text>
            <Text size="sm" c={isDark ? 'gray.5' : 'gray.6'} lh={rem(18)} ta="center">
              Размер файла не должен превышать {formatBytes(MAX_3D_MODEL_FILE_SIZE)}.<br />
              Допустимые форматы {ACCEPTED_3D_MODEL_FILE_TYPES.map((i) => i.substring(1).toUpperCase()).join(', ')}.
              <br />
              ZIP-архив должен содержать ровно один файл модели (.glb/.gltf/.fbx/.dae/.stl) или один или несколько .obj
              файлов.
            </Text>
          </Stack>
        </Dropzone>
        {showObjTip && (
          <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />} mt="sm">
            Упакуйте OBJ + MTL + текстуры в .zip-архив для полной поддержки материалов.
          </Alert>
        )}
        {showProgress && <Progress value={uploadProgress} mt="sm" />}
        <Group mt={12} justify="space-between" c={!model ? 'dimmed' : undefined} gap={16} wrap="nowrap" align="center">
          <Tooltip label={model?.name ?? 'Файл не выбран'} position="top-start" openDelay={500}>
            <Text lh={rem(20)} size="sm" truncate="end">
              {model ? model.name : 'Файл не выбран'}
            </Text>
          </Tooltip>
          <Group align="center" gap={12}>
            <Text lh={rem(20)} size="sm">
              {formatBytes(model?.size ?? 0)}
            </Text>
          </Group>
        </Group>
        <Group align="center" justify="space-between" wrap="nowrap" mt={24}>
          <Button fullWidth variant="outline" onClick={close} disabled={isLoading}>
            Отмена
          </Button>
          <Button fullWidth loading={isLoading} disabled={!model} onClick={onUpload}>
            Загрузить
          </Button>
        </Group>
      </Modal>
    </>
  );
}
