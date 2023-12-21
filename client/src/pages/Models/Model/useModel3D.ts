import { useWindowScroll } from '@mantine/hooks';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModel3DQuery, useSaveThumbnailBase64Mutation } from '@/api/models-3d.ts';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import RouterPaths from '@/router/paths.ts';
import canNavigateBack from '@/utils/canNavigateBack.ts';

export default function useModel3D() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useModel3DQuery(id ?? '', { skip: !id });
  const [saveThumbnailBase64] = useSaveThumbnailBase64Mutation();
  const [, scrollTo] = useWindowScroll();
  const onBack = () => navigate(canNavigateBack() ? -1 : (RouterPaths.Base as any));

  useDocumentTitle(data?.name ?? 'Модель');
  useEffect(() => {
    if (!id) return navigate(RouterPaths.Base);
    scrollTo({ y: 0 });
  }, [id]);

  return {
    model: data,
    isModelLoading: isLoading,
    isModelError: isError,
    onBack,
    saveThumbnailBase64,
  };
}
