import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { IconBell, IconBuilding, IconCube, IconMessageCircle, IconMovie, IconPhoto } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import type { NotificationDto } from '@/app/api/dto.ts';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/app/api/notifications.ts';
import { EmptyData } from '@/widgets/EmptyData';
import type { ReactNode } from 'react';

const POLL_INTERVAL_MS = 60_000;

const NotificationTypes = {
  CommentAdded: 'comment_added',
  InviteAccepted: 'invite_accepted',
  ModelUploaded: 'model_uploaded',
  ModelVersionProcessed: 'model_version_processed',
} as const;

function typeIcon(type: string): ReactNode {
  switch (type) {
    case NotificationTypes.CommentAdded:
      return <IconMessageCircle size={14} />;
    case NotificationTypes.InviteAccepted:
      return <IconBuilding size={14} />;
    case NotificationTypes.ModelUploaded:
      return <IconCube size={14} />;
    case NotificationTypes.ModelVersionProcessed:
      return <IconPhoto size={14} />;
    default:
      return <IconMovie size={14} />;
  }
}

function buildLink(n: NotificationDto): string | null {
  const payload = n.payload ?? {};
  const sceneId = typeof payload.sceneId === 'string' ? payload.sceneId : null;
  const modelId = typeof payload.modelId === 'string' ? payload.modelId : null;
  const orgId = typeof payload.orgId === 'string' ? payload.orgId : null;

  if (sceneId) {
    return `/scenes/${sceneId}`;
  }
  if (modelId) {
    return `/models-3d/${modelId}`;
  }
  if (orgId) {
    return `/org/${orgId}`;
  }
  return null;
}

function getMessage(n: NotificationDto): string {
  const payload = n.payload ?? {};
  if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }
  switch (n.type) {
    case NotificationTypes.CommentAdded:
      return 'Новый комментарий';
    case NotificationTypes.InviteAccepted:
      return 'Приглашение принято';
    case NotificationTypes.ModelUploaded:
      return 'Загружена новая модель';
    case NotificationTypes.ModelVersionProcessed:
      return 'Версия модели обработана';
    default:
      return 'Уведомление';
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
  });
  const { data: notifications = [] } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const count = countData?.count ?? 0;

  const handleClickItem = async (n: NotificationDto) => {
    if (!n.isRead) {
      try {
        await markRead({ id: n.id }).unwrap();
      } catch {
        // ignore
      }
    }
    const link = buildLink(n);
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
    } catch {
      // ignore
    }
  };

  return (
    <Popover width={360} shadow="md" position="bottom-end">
      <Popover.Target>
        <Indicator label={count > 9 ? '9+' : String(count)} size={16} disabled={count === 0} color="red" offset={4}>
          <Tooltip label="Уведомления">
            <ActionIcon variant="subtle" size="lg" aria-label="Уведомления">
              <IconBell size={20} />
            </ActionIcon>
          </Tooltip>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <Group justify="space-between" p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <Text fw={600}>Уведомления</Text>
          <Anchor size="xs" component="button" type="button" onClick={handleMarkAll}>
            Отметить все как прочитанные
          </Anchor>
        </Group>
        <ScrollArea.Autosize mah={400}>
          <Stack gap={0}>
            {notifications.length === 0 && (
              <Box py="xl" px="md">
                <EmptyData label="Нет уведомлений" labelSize="sm" width={120} height={75} />
              </Box>
            )}
            {notifications.map((n) => (
              <UnstyledButton
                key={n.id}
                p="sm"
                style={{
                  opacity: n.isRead ? 0.6 : 1,
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                }}
                onClick={() => handleClickItem(n)}
              >
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon size="sm" variant="light">
                    {typeIcon(n.type)}
                  </ThemeIcon>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" lineClamp={2}>
                      {getMessage(n)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {dayjs(n.createdAt).fromNow()}
                    </Text>
                  </Box>
                  {!n.isRead && (
                    <Badge size="xs" color="blue">
                      новое
                    </Badge>
                  )}
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
