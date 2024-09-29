import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { FileWithPath } from 'react-dropzone-esm';
import { useNavigate } from 'react-router-dom';
import { useUpload3DModelMutation } from '@/app/api/models-3d.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';

export function useUpload3DModal() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [model, setModel] = useState<FileWithPath | null>(null);
  const [upload, { isLoading }] = useUpload3DModelMutation();

  useEffect(() => {
    if (!opened) setModel(null);
  }, [opened]);

  return {
    opened,
    open,
    close,
    model,
    setModel,
    isLoading,
    onUpload: async () => {
      if (!model) return;

      const formData = new FormData();
      formData.set('file', model);

      try {
        const { modelId } = await upload(formData).unwrap();
        notifications.show({
          message: 'Модель успешно загружена',
          color: 'green',
          autoClose: 3000,
        });
        close();

        navigate(buildAbsolutePath([RouterPaths.Models, modelId]));
      } catch (e) {
        notifications.show({
          title: 'Ошибка',
          message: (e as any)?.message ?? 'Не удалось загрузить файл',
          color: 'red',
          autoClose: 10000,
        });
      }
    },
  };
}
