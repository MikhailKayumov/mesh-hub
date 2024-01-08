import { notifications } from '@mantine/notifications';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModel3DQuery, useSaveThumbnailFromBase64Mutation } from '@/api/models-3d.ts';
import { AppRegexp } from '@/constants';
import RouterPaths from '@/router/paths.ts';

export default function useModel3DData() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useModel3DQuery(id ?? '', { skip: !id });
  const [saveThumbnailFromBase64, { isLoading: isThumbnailSaving }] = useSaveThumbnailFromBase64Mutation();

  const saveThumbnail = async (base64: string) => {
    if (!data || !base64) return;

    const decodedData = base64.replace(/^data:image\/png;base64,/, '');
    if (!AppRegexp.Base64.test(decodedData)) return;

    try {
      await saveThumbnailFromBase64({ id: data.id, thumbnail: base64 }).unwrap();
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

  useEffect(() => {
    if (!id) return navigate(RouterPaths.Base);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [id]);

  return useMemo(
    () => ({
      model: data,
      isModelLoading: isLoading,
      isModelError: isError,
      isThumbnailSaving,
      saveThumbnail,
    }),
    [data, isLoading, isError, isThumbnailSaving],
  );
}

export type UseModel3DDataReturn = ReturnType<typeof useModel3DData>;
