import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useDelete3DModelMutation } from '@/api/models-3d.ts';
import RouterPaths from '@/router/paths.ts';

export default function useDeleteModel3D(id: string) {
  const navigate = useNavigate();
  const [deleteModel, { isLoading: isDeleting }] = useDelete3DModelMutation();

  const onDelete = async () => {
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
