import type { DataTableSortStatus } from 'mantine-datatable';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useSearchParamsTableSorting<T = Record<string, unknown>>(
  paramName = 'sort',
  initial?: DataTableSortStatus<T>,
): [DataTableSortStatus<T> | undefined, (status: DataTableSortStatus<T>) => void, string | null] {
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<T> | undefined>(initial);
  const [searchParams, setSearchParams] = useSearchParams();

  const setSorting = (status: DataTableSortStatus<T>) => {
    if (
      status.columnAccessor === sortStatus?.columnAccessor &&
      status.direction === 'asc' &&
      sortStatus.direction === 'desc'
    ) {
      setSortStatus(undefined);
      searchParams.delete(paramName);
    } else {
      setSortStatus(status);
      searchParams.set(paramName, `${status.direction === 'asc' ? '+' : '-'}${status.columnAccessor.toString()}`);
    }

    setSearchParams(Object.fromEntries(searchParams.entries()));
  };

  return [sortStatus, setSorting, searchParams.get(paramName)];
}
