import { ActionIcon, Button, Group, Title } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import { useCloseCurrentUserSessionsMutation, useCurrentUserSessionsQuery } from '@/api/auth.ts';
import { SessionResponseDto } from '@/api/dto.ts';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';
import useSearchParamsPagination from '@/hooks/useSearchParamsPagination.ts';
import useSearchParamsTableSorting from '@/hooks/useSearchParamsTableSorting.ts';
import useSession from '@/hooks/useSession.ts';
import columns from './columns.tsx';

const PAGE_SIZE = 10;

export default function SessionTable() {
  const session = useSession();

  const [closeAll, { isLoading: isClosing }] = useCloseCurrentUserSessionsMutation();
  const [page, onPageChange] = useSearchParamsPagination();
  const [sortStatus, onSortStatusChange, sortParam] = useSearchParamsTableSorting<SessionResponseDto>();

  const { isDark } = useCurrentColorScheme();
  const { data, refetch, isLoading, isFetching } = useCurrentUserSessionsQuery(
    { skip: (page - 1) * PAGE_SIZE, size: PAGE_SIZE, sort: sortParam ? [sortParam] : undefined },
    { pollingInterval: 30000 },
  );

  return (
    <>
      <Group justify="space-between" mt={24} mb="sm">
        <Title order={4} fw={400}>
          Открытые сессии
        </Title>
        <Group gap="sm">
          <ActionIcon w={36} h={36} onClick={refetch} loading={isLoading || isFetching}>
            <IconRefresh size={24} />
          </ActionIcon>
          <Button loading={isClosing} onClick={() => closeAll()}>
            Закрыть все сессии
          </Button>
        </Group>
      </Group>
      <DataTable<SessionResponseDto>
        pinLastColumn
        withTableBorder
        fz="sm"
        borderRadius="sm"
        horizontalSpacing="xs"
        verticalSpacing="xs"
        records={data?.data}
        fetching={isLoading}
        columns={columns}
        minHeight={141}
        height="auto"
        width="100%"
        style={{ overflow: 'hidden', width: '100%' }}
        rowStyle={({ id }) => {
          if (session !== id) return;
          return (theme) => ({ backgroundColor: isDark ? theme.colors.dark[8] : theme.colors.gray[1] });
        }}
        // pagination
        page={page}
        totalRecords={data?.totalCount}
        recordsPerPage={PAGE_SIZE}
        onPageChange={onPageChange}
        // sorting
        sortStatus={sortStatus as any}
        onSortStatusChange={onSortStatusChange}
      />
    </>
  );
}
