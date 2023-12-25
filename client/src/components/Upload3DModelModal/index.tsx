import { Button, Group, Modal, rem, Stack, Text, Tooltip } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconCubePlus, IconUpload } from '@tabler/icons-react';
import { FileRejection } from 'react-dropzone-esm';
import validate3DModelFile from '@/components/Upload3DModelModal/validate3DModelFile.ts';
import { ACCEPTED_3D_MODEL_FILE_TYPES, MAX_3D_MODEL_FILE_SIZE } from '@/constants/files.ts';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';
import formatBytes from '@/utils/format-bytes.ts';
import classes from './Upload3DModelModal.module.scss';
import useUpload3DModal from './useUpload3DModal.ts';

const onReject = (fileRejections: FileRejection[]) => {
  const msg = fileRejections?.[0]?.errors?.[0]?.message;

  notifications.show({
    title: 'Ошибка',
    message: msg || 'Неверный формат файла или его размер превышает 100МБ.',
    color: 'red',
    autoClose: 10000,
  });
};

export default function Upload3DModelModal() {
  const { isDark } = useCurrentColorScheme();
  const { opened, model, isLoading, open, close, setModel, onUpload } = useUpload3DModal();

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
          onDrop={(files) => setModel(files[0])}
          onReject={onReject}
          validator={validate3DModelFile}
          className={classes.dropzone}
          // todo: not remove, next iteration make progress
          // loaderProps={{
          //   children: (
          //     <Group gap={2}>
          //       <RingProgress
          //         size={120}
          //         thickness={8}
          //         roundCaps
          //         sections={[{ value: progress, color: 'primary' }]}
          //         label={
          //           <Text fw={700} ta="center" size="xl">
          //             {progress}%
          //           </Text>
          //         }
          //       />
          //     </Group>
          //   ),
          // }}
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
              Допустимые форматы {ACCEPTED_3D_MODEL_FILE_TYPES.map((i) => i.substring(1).toUpperCase()).join(', ')}
            </Text>
          </Stack>
        </Dropzone>
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
