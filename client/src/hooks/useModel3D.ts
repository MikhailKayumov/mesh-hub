import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModel3DQuery } from '@/api/models-3d.ts';
import { RouterPaths } from '@/router/paths.ts';
import { sleep } from '@/utils/sleep.ts';

export interface UseModel3DProps {
  id?: string;
}

export function useModel3D({ id }: UseModel3DProps) {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useModel3DQuery(id ?? '', { skip: !id });

  useEffect(() => {
    if (!id) {
      navigate(RouterPaths.Base);
    } else {
      sleep(0.1).then(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }));
    }
  }, [id]);

  return useMemo(
    () => ({
      model3d: data ?? null,
      isModelLoading: isLoading,
      isModelError: isError,
    }),
    [data, isLoading, isError],
  );
}
