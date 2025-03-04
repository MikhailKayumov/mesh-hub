import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useDelete3DModelMutation } from '@/app/api/models-3d.ts';
import { RouterPaths } from '@/shared/router/paths.ts';

export function useDeleteModel3D(id?: string | null) {
  const navigate = useNavigate();
  const [deleteModel, { isLoading: isDeleting }] = useDelete3DModelMutation();

  const onDelete = async () => {
    if (!id) return;

    try {
      await deleteModel(id).unwrap();
      notifications.show({
        message: '3D успешно удалена',
        color: 'green',
        autoClose: 3000,
      });

      navigate(RouterPaths.Base);
    } catch (e) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить 3D модель',
        color: 'red',
        autoClose: 10000,
      });
    }
  };

  return {
    isDeleting,
    onDelete,
  };
}
