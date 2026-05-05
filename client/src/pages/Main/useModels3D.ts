import { useSearchParams } from 'react-router-dom';
import { useModels3DQuery } from '@/app/api/models-3d.ts';
import { useSearchParamsPagination } from '@/shared/hooks';

const PAGE_SIZE = 12;

export function useModels3D() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useSearchParamsPagination();

  const search = searchParams.get('search') ?? '';
  const categoriesParam = searchParams.get('categories');
  const categories = categoriesParam ? categoriesParam.split(',').map(Number).filter(Boolean) : [];
  // Format: [+-][fieldName] matching PaginatedRequest decorator, e.g. "-createdAt" = DESC
  const sort = searchParams.get('sort') ?? '-createdAt';

  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value);
    else next.delete('search');
    next.delete('page');
    setSearchParams(Object.fromEntries(next.entries()));
  };

  const setCategories = (value: number[]) => {
    const next = new URLSearchParams(searchParams);
    if (value.length) next.set('categories', value.join(','));
    else next.delete('categories');
    next.delete('page');
    setSearchParams(Object.fromEntries(next.entries()));
  };

  const setSort = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== '-createdAt') next.set('sort', value);
    else next.delete('sort');
    next.delete('page');
    setSearchParams(Object.fromEntries(next.entries()));
  };

  const { data, isLoading, isFetching } = useModels3DQuery({
    size: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    search: search || undefined,
    categories: categories.length ? categories : undefined,
    sort,
  });

  return {
    models: data?.data ?? [],
    isModelsLoading: isLoading,
    isModelsFetching: isFetching,
    page,
    setPage,
    totalPages: Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE),
    totalCount: data?.totalCount ?? 0,
    search,
    setSearch,
    categories,
    setCategories,
    sort,
    setSort,
  };
}
