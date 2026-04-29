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
import { IconCheck, IconCopy, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useCreateApiKeyMutation, useGetApiKeysQuery, useRevokeApiKeyMutation } from '@/app/api/api-keys.ts';
import { API_KEY_SCOPES, type ApiKeyResponseDto, type ApiKeyScope } from '@/app/api/dto.ts';
import { EmptyData } from '@/widgets/EmptyData';

interface Props {
  orgId: string;
}

const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  'embed:read': 'Просмотр embed-проектов',
  'read:models': 'Чтение моделей',
  'read:scenes': 'Чтение сцен',
};

export function ApiKeysTab({ orgId }: Props) {
  const { data: keys, isLoading } = useGetApiKeysQuery(orgId, { skip: !orgId });
  const [createApiKey, { isLoading: creating }] = useCreateApiKeyMutation();
  const [revokeApiKey] = useRevokeApiKeyMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyResponseDto | null>(null);

  const form = useForm<{ name: string; scopes: ApiKeyScope[] }>({
    initialValues: { name: '', scopes: ['embed:read'] },
    validate: {
      name: (v) => (v.trim().length === 0 ? 'Укажите название' : null),
      scopes: (v) => (v.length === 0 ? 'Выберите хотя бы один scope' : null),
    },
  });

  function openCreateModal() {
    form.reset();
    setCreatedKey(null);
    setCreateOpen(true);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreatedKey(null);
    form.reset();
  }

  async function handleCreate(values: { name: string; scopes: ApiKeyScope[] }) {
    try {
      const res = await createApiKey({
        orgId,
        dto: { orgId, name: values.name.trim(), scopes: values.scopes },
      }).unwrap();
      setCreatedKey(res);
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: err?.data?.message ?? 'Не удалось создать API-ключ',
      });
    }
  }

  function handleRevoke(keyId: string, name: string) {
    modals.openConfirmModal({
      title: 'Отозвать API-ключ',
      children: (
        <Text size="sm">
          Отозвать ключ <b>{name}</b>? Это действие нельзя отменить.
        </Text>
      ),
      labels: { confirm: 'Отозвать', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await revokeApiKey({ orgId, keyId }).unwrap();
        } catch (err: any) {
          notifications.show({
            color: 'red',
            title: 'Ошибка',
            message: err?.data?.message ?? 'Не удалось отозвать ключ',
          });
        }
      },
    });
  }

  return (
    <Stack gap="sm">
      <Group justify="flex-end">
        <Button size="sm" leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          Создать API-ключ
        </Button>
      </Group>

      {isLoading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (keys ?? []).length === 0 ? (
        <Stack align="center" py="xl" gap="md">
          <EmptyData label="Нет API-ключей" width={160} height={100} />
        </Stack>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Префикс</Table.Th>
              <Table.Th>Scopes</Table.Th>
              <Table.Th>Использован</Table.Th>
              <Table.Th>Создан</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(keys ?? []).map((k) => {
              const isRevoked = !!k.revokedAt;
              return (
                <Table.Tr key={k.id}>
                  <Table.Td>{k.name}</Table.Td>
                  <Table.Td>
                    <Code>{k.prefix}</Code>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {k.scopes.map((s) => (
                        <Badge key={s} variant="light" size="sm">
                          {s}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}</Table.Td>
                  <Table.Td>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : '—'}</Table.Td>
                  <Table.Td>
                    <Badge color={isRevoked ? 'gray' : 'green'} variant="light">
                      {isRevoked ? 'Отозван' : 'Активен'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {!isRevoked && (
                      <Tooltip label="Отозвать">
                        <ActionIcon variant="subtle" size="sm" color="red" onClick={() => handleRevoke(k.id, k.name)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={createOpen}
        onClose={closeCreateModal}
        title={createdKey ? 'API-ключ создан' : 'Новый API-ключ'}
        closeOnClickOutside={!createdKey}
        closeOnEscape={!createdKey}
        withCloseButton={!createdKey}
      >
        {createdKey ? (
          <Stack gap="sm">
            <Text size="sm" c="red" fw={600}>
              Сохраните ключ сейчас — он показывается только один раз!
            </Text>
            <Text size="xs" c="dimmed">
              Используйте этот ключ в заголовке X-Api-Key при вызове API.
            </Text>
            <Group gap="xs" wrap="nowrap" align="center">
              <Code style={{ flex: 1, wordBreak: 'break-all' }}>{createdKey.rawKey ?? ''}</Code>
              <CopyButton value={createdKey.rawKey ?? ''} timeout={2000}>
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
              Я сохранил ключ
            </Button>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(handleCreate)}>
            <Stack gap="sm">
              <TextInput label="Название" placeholder="Production embed key" {...form.getInputProps('name')} />
              <Checkbox.Group
                label="Scopes"
                description="Какие действия разрешены этому ключу"
                {...form.getInputProps('scopes')}
              >
                <Stack gap="xs" mt="xs">
                  {API_KEY_SCOPES.map((s) => (
                    <Checkbox key={s} value={s} label={`${SCOPE_LABELS[s]} (${s})`} />
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
    </Stack>
  );
}
