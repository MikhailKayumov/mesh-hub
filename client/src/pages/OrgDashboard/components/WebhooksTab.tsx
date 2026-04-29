import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Checkbox,
  Code,
  CopyButton,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCopy, IconHistory, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { WEBHOOK_EVENTS, type WebhookCreateResponseDto, type WebhookEvent } from '@/app/api/dto.ts';
import {
  useCreateWebhookMutation,
  useGetWebhookDeliveriesQuery,
  useGetWebhooksQuery,
  useRevokeWebhookMutation,
} from '@/app/api/webhooks.ts';
import { EmptyData } from '@/widgets/EmptyData';

interface Props {
  orgId: string;
}

const EVENT_LABELS: Record<WebhookEvent, string> = {
  'model.uploaded': 'Загрузка модели',
  'comment.added': 'Новый комментарий',
  'scene.created': 'Создание сцены',
};

export function WebhooksTab({ orgId }: Props) {
  const { data: webhooks, isLoading } = useGetWebhooksQuery(orgId, { skip: !orgId });
  const [createWebhook, { isLoading: creating }] = useCreateWebhookMutation();
  const [revokeWebhook] = useRevokeWebhookMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<WebhookCreateResponseDto | null>(null);
  const [deliveriesFor, setDeliveriesFor] = useState<{ id: string; url: string } | null>(null);

  const form = useForm<{ url: string; events: WebhookEvent[] }>({
    initialValues: { url: '', events: [] },
    validate: {
      url: (v) => {
        if (!v.trim()) return 'Укажите URL';
        try {
          const u = new URL(v.trim());
          if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'URL должен начинаться с http(s)://';
          return null;
        } catch {
          return 'Некорректный URL';
        }
      },
      events: (v) => (v.length === 0 ? 'Выберите хотя бы одно событие' : null),
    },
  });

  function openCreateModal() {
    form.reset();
    setCreatedSecret(null);
    setCreateOpen(true);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreatedSecret(null);
    form.reset();
  }

  async function handleCreate(values: { url: string; events: WebhookEvent[] }) {
    try {
      const res = await createWebhook({
        orgId,
        dto: { url: values.url.trim(), events: values.events },
      }).unwrap();
      setCreatedSecret(res);
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: err?.data?.message ?? 'Не удалось создать webhook',
      });
    }
  }

  function handleRevoke(webhookId: string, url: string) {
    modals.openConfirmModal({
      title: 'Отозвать webhook',
      children: (
        <Text size="sm">
          Отозвать webhook на <b>{url}</b>? Это действие нельзя отменить.
        </Text>
      ),
      labels: { confirm: 'Отозвать', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await revokeWebhook({ orgId, webhookId }).unwrap();
        } catch (err: any) {
          notifications.show({
            color: 'red',
            title: 'Ошибка',
            message: err?.data?.message ?? 'Не удалось отозвать webhook',
          });
        }
      },
    });
  }

  return (
    <Stack gap="sm">
      <Group justify="flex-end">
        <Button size="sm" leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          Добавить webhook
        </Button>
      </Group>

      {isLoading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (webhooks ?? []).length === 0 ? (
        <Stack align="center" py="xl" gap="md">
          <EmptyData label="Нет настроенных webhooks" width={160} height={100} />
        </Stack>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>URL</Table.Th>
              <Table.Th>События</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Создан</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(webhooks ?? []).map((wh) => (
              <Table.Tr key={wh.id}>
                <Table.Td style={{ maxWidth: 320, wordBreak: 'break-all' }}>{wh.url}</Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {wh.events.map((ev) => (
                      <Badge key={ev} variant="light" size="sm">
                        {ev}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge color={wh.isActive ? 'green' : 'gray'} variant="light">
                    {wh.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                </Table.Td>
                <Table.Td>{new Date(wh.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    <Tooltip label="Журнал доставок">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => setDeliveriesFor({ id: wh.id, url: wh.url })}
                      >
                        <IconHistory size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Отозвать">
                      <ActionIcon variant="subtle" size="sm" color="red" onClick={() => handleRevoke(wh.id, wh.url)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Create modal */}
      <Modal
        opened={createOpen}
        onClose={closeCreateModal}
        title={createdSecret ? 'Webhook создан' : 'Новый webhook'}
        closeOnClickOutside={!createdSecret}
        closeOnEscape={!createdSecret}
        withCloseButton={!createdSecret}
      >
        {createdSecret ? (
          <Stack gap="sm">
            <Text size="sm" c="red" fw={600}>
              Сохраните секрет сейчас — он показывается только один раз!
            </Text>
            <Text size="xs" c="dimmed">
              Секрет используется для подписи доставляемых событий (HMAC SHA-256).
            </Text>
            <Group gap="xs" wrap="nowrap" align="center">
              <Code style={{ flex: 1, wordBreak: 'break-all' }}>{createdSecret.secret}</Code>
              <CopyButton value={createdSecret.secret} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Скопировано' : 'Скопировать'}>
                    <ActionIcon variant="light" color={copied ? 'teal' : 'blue'} onClick={copy}>
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
            <Button onClick={closeCreateModal} mt="sm">
              Я сохранил секрет
            </Button>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(handleCreate)}>
            <Stack gap="sm">
              <TextInput label="URL" placeholder="https://example.com/webhook" {...form.getInputProps('url')} />
              <Checkbox.Group
                label="События"
                description="Выберите события, которые будут доставляться"
                {...form.getInputProps('events')}
              >
                <Stack gap="xs" mt="xs">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <Checkbox key={ev} value={ev} label={`${EVENT_LABELS[ev]} (${ev})`} />
                  ))}
                </Stack>
              </Checkbox.Group>
              <Button type="submit" loading={creating}>
                Создать
              </Button>
            </Stack>
          </form>
        )}
      </Modal>

      {/* Deliveries modal */}
      <DeliveriesModal orgId={orgId} webhook={deliveriesFor} onClose={() => setDeliveriesFor(null)} />
    </Stack>
  );
}

interface DeliveriesProps {
  orgId: string;
  webhook: { id: string; url: string } | null;
  onClose: () => void;
}

function DeliveriesModal({ orgId, webhook, onClose }: DeliveriesProps) {
  const { data: deliveries, isLoading } = useGetWebhookDeliveriesQuery(
    { orgId, webhookId: webhook?.id ?? '' },
    { skip: !webhook },
  );

  return (
    <Modal opened={!!webhook} onClose={onClose} title="Журнал доставок" size="lg">
      {webhook && (
        <Stack gap="sm">
          <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
            {webhook.url}
          </Text>
          {isLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : (deliveries ?? []).length === 0 ? (
            <Center py="md">
              <Text c="dimmed" size="sm">
                Доставок пока нет
              </Text>
            </Center>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Событие</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Время</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(deliveries ?? []).map((d) => {
                  const success = d.deliveredAt && d.responseStatus && d.responseStatus < 400;
                  const ts = d.deliveredAt ?? d.failedAt ?? d.createdAt;
                  return (
                    <Table.Tr key={d.id}>
                      <Table.Td>
                        <Badge variant="light" size="sm">
                          {d.event}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={success ? 'green' : 'red'} variant="light" size="sm">
                          {d.responseStatus ?? 'Ошибка'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">{new Date(ts).toLocaleString()}</Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      )}
    </Modal>
  );
}
