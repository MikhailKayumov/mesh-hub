import { useCurrentUser3DModelsQuery } from '@/api/models-3d.ts';
import { useSearchParamsPagination } from '@/hooks/useSearchParamsPagination.ts';

const PAGE_SIZE = 12;

export function useModels3D() {
  const [page, setPage] = useSearchParamsPagination();

  const { data, isLoading } = useCurrentUser3DModelsQuery({ size: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE });

  return {
    models: data?.data ?? [],
    isModelsLoading: isLoading,
    page,
    setPage,
    totalPages: Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE),
    totalCount: data?.totalCount ?? 0,
  };
}
