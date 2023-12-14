import { useSearchParams } from 'react-router-dom';

export default function useSearchParamsPagination(paramName = 'page'): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const setPage = (page: number) => {
    searchParams.set(paramName, page.toString());
    setSearchParams(Object.fromEntries(searchParams.entries()));
  };

  return [Number(searchParams.get(paramName) ?? 1), setPage];
}
