import { Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import { DataTableColumn } from 'mantine-datatable';
import { SessionResponseDto } from '@/api/dto.ts';
import CloseSessionColumn from './CloseSessionColumn.tsx';

const columns: DataTableColumn<SessionResponseDto>[] = [
  {
    accessor: 'createdAt',
    title: 'Дата создания',
    noWrap: true,
    sortable: true,
    render: (date) => dayjs(date.createdAt).format('lll'),
  },
  {
    accessor: 'updatedAt',
    title: 'Дата обновления',
    noWrap: true,
    sortable: true,
    render: (date) => dayjs(date.updatedAt).format('lll'),
  },
  {
    accessor: 'expiredAt',
    title: 'Дата истечения',
    noWrap: true,
    sortable: true,
    render: (date) => dayjs(date.expireAt).format('lll'),
  },
  {
    accessor: 'ip',
    title: 'IP адрес',
    noWrap: true,
  },
  {
    accessor: 'userAgent',
    title: 'Информация о браузере',
    width: 450,
    render: ({ userAgent }) => (
      <Tooltip withArrow multiline fz={12} position="bottom-start" w={430} label={userAgent}>
        <Text size="sm" truncate="end">
          {userAgent}
        </Text>
      </Tooltip>
    ),
  },
  {
    accessor: 'id',
    title: '',
    width: 48,
    render: ({ id }) => <CloseSessionColumn id={id} />,
  },
];

export default columns;
