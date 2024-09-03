import { useSearchParams } from 'react-router-dom';

export function useSearchParamsPagination(
  paramName = 'page',
  clearParamOnFirstPage = true,
): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const setPage = (page: number) => {
    if (clearParamOnFirstPage && page === 1) {
      searchParams.delete(paramName);
    } else {
      searchParams.set(paramName, page.toString());
    }

    setSearchParams(Object.fromEntries(searchParams.entries()));
  };

  return [Number(searchParams.get(paramName) ?? 1), setPage];
}
