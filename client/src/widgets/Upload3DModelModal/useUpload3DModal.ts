import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Api } from '@/app/api/base.ts';
import { ApiTags } from '@/app/api/tags.ts';
import { currentWorkspaceIdSelector } from '@/entities/organization/selectors.ts';
import { uploadModel3DWithProgress } from '@/shared/api/uploadModel3DWithProgress.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import type { FileWithPath } from 'react-dropzone-esm';

export function useUpload3DModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [model, setModel] = useState<FileWithPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const currentWorkspaceId = useSelector(currentWorkspaceIdSelector);

  useEffect(() => {
    if (!opened) {
      queueMicrotask(() => {
        setModel(null);
        setUploadProgress(0);
        setError(null);
      });
    }
  }, [opened]);

  return {
    opened,
    open,
    close,
    model,
    setModel,
    isLoading,
    uploadProgress,
    error,
    onUpload: async () => {
      if (!model) return;

      const formData = new FormData();
      formData.set('file', model);
      if (currentWorkspaceId) {
        formData.set('workspaceId', currentWorkspaceId);
      }

      setIsLoading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const { modelId } = await uploadModel3DWithProgress(formData, setUploadProgress);

        dispatch(Api.util.invalidateTags([{ type: ApiTags.CurrentUser3DModels }, { type: ApiTags.Get3DModels }]));

        notifications.show({
          message: 'Модель успешно загружена',
          color: 'green',
          autoClose: 3000,
        });
        close();

        navigate(buildAbsolutePath([RouterPaths.Models, modelId]));
      } catch (e) {
        const message = (e as any)?.message ?? 'Не удалось загрузить файл';
        setError(message);
        setUploadProgress(0);
        notifications.show({
          title: 'Ошибка',
          message,
          color: 'red',
          autoClose: 10000,
        });
      } finally {
        setIsLoading(false);
      }
    },
  };
}
