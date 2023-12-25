import { useWindowScroll } from '@mantine/hooks';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModel3DQuery, useSaveThumbnailBase64Mutation } from '@/api/models-3d.ts';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import RouterPaths from '@/router/paths.ts';

export default function useModel3D() {
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useModel3DQuery(id ?? '', { skip: !id });

  useDocumentTitle(data?.name ?? 'Модель');

  const [saveThumbnailBase64] = useSaveThumbnailBase64Mutation();
  const [, scrollTo] = useWindowScroll();

  useEffect(() => {
    if (!id) return navigate(RouterPaths.Base);
    scrollTo({ y: 0 });
  }, [id]);

  return {
    model: data,
    isModelLoading: isLoading,
    isModelError: isError,
    saveThumbnailBase64: (base64: string) => {
      if (!data) return;

      saveThumbnailBase64({ id: data.id, thumbnail: base64 });
    },
  };
}
