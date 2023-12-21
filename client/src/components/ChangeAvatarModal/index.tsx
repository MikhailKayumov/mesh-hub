import { Avatar, Button, Group, Modal, rem, Stack, Text } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { FileWithPath } from 'react-dropzone-esm';
import { useUpdateCurrentUserAvatarMutation } from '@/api/user.ts';
import { MAX_AVATAR_FILE_SIZE } from '@/constants/files.ts';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';
import formatBytes from '@/utils/format-bytes.ts';
import classes from './ChangeAvatarModal.module.scss';

export interface ChangeAvatarModalProps {
  currentImage: string | null;
  opened: boolean;
  close: () => void;
}

const onReject = () => {
  notifications.show({
    title: 'Ошибка',
    message: 'Неверный формат файла или его размер превышает 1МБ',
    color: 'red',
    autoClose: 10000,
  });
};

export default function ChangeAvatarModal({ currentImage, opened, close }: ChangeAvatarModalProps) {
  const { isDark } = useCurrentColorScheme();
  const [newImage, setNewImage] = useState<FileWithPath | null>(null);
  const [saveAvatar, { isLoading }] = useUpdateCurrentUserAvatarMutation();

  useEffect(() => {
    if (!opened) setNewImage(null);
  }, [opened]);

  const onDrop = (files: FileWithPath[]) => {
    if (!files.length) return;
    setNewImage(files[0]);
  };
  const onSave = async () => {
    const body = new FormData();
    if (newImage) body.append('file', newImage);

    try {
      await saveAvatar(body as any).unwrap();
      close();
    } catch (e) {
      notifications.show({
        title: 'Ошибка',
        message: (e as any)?.message ?? 'Не удалось загрузить файл',
        color: 'red',
        autoClose: 10000,
      });
    }
  };

  return (
    <Modal
      centered
      opened={opened}
      size="lg"
      padding={24}
      onClose={close}
      title="Изменение фотографии профиля"
      className={classes.root}
      closeOnClickOutside={!isLoading}
      closeOnEscape={!isLoading}
      closeButtonProps={{ disabled: isLoading }}
    >
      <Group wrap="nowrap" gap={24}>
        <Dropzone
          multiple={false}
          onDrop={onDrop}
          onReject={onReject}
          maxSize={MAX_AVATAR_FILE_SIZE}
          accept={IMAGE_MIME_TYPE}
          disabled={isLoading}
          h={180}
        >
          <Stack align="center" justify="center" gap={12}>
            <Dropzone.Idle>
              <IconPhoto
                style={{
                  width: rem(58),
                  height: rem(58),
                  color: isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)',
                }}
                stroke={1.5}
              />
            </Dropzone.Idle>
            <Dropzone.Accept>
              <IconUpload
                style={{ width: rem(58), height: rem(58), color: 'var(--mantine-color-primary-6)' }}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX style={{ width: rem(58), height: rem(58), color: 'var(--mantine-color-red-6)' }} stroke={1.5} />
            </Dropzone.Reject>
            <Text size="md" c={isDark ? 'gray.3' : 'gray.8'} ta="center" lh={rem(22)}>
              Переместите изображение сюда или нажмите чтобы выбрать файл
            </Text>
            <Text size="sm" c={isDark ? 'gray.5' : 'gray.6'} inline ta="center">
              Размер файла не должен превышать {formatBytes(MAX_AVATAR_FILE_SIZE)}
            </Text>
          </Stack>
        </Dropzone>
        <Avatar
          h={180}
          w={180}
          radius="sm"
          className={classes.preview}
          color="primary"
          src={newImage ? URL.createObjectURL(newImage) : currentImage}
        />
      </Group>
      <Group align="center" justify="space-between" wrap="nowrap" mt={24}>
        <Button fullWidth variant="outline" onClick={close} disabled={isLoading}>
          Отмена
        </Button>
        <Button fullWidth onClick={onSave} loading={isLoading} disabled={!newImage}>
          Сохранить
        </Button>
      </Group>
    </Modal>
  );
}
