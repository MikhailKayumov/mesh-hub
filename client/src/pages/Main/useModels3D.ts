import { useModels3DQuery } from '@/app/api/models-3d.ts';
import { useSearchParamsPagination } from '@/shared/hooks';

const PAGE_SIZE = 6;

export function useModels3D() {
  const [page, setPage] = useSearchParamsPagination();

  const { data, isLoading, isFetching } = useModels3DQuery({ size: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE });

  return {
    models: data?.data ?? [],
    isModelsLoading: isLoading,
    isModelsFetching: isFetching,
    page,
    setPage,
    totalPages: Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE),
    totalCount: data?.totalCount ?? 0,
  };
}
