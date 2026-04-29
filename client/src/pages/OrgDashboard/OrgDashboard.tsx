import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Menu,
  Modal,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconCube, IconDots, IconMovie, IconPlus, IconTrash, IconUserEdit } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { OrgMemberRole, StorageBackend } from '@/app/api/dto.ts';
import { useEmbedProjectsQuery, useCreateEmbedProjectMutation } from '@/app/api/embed.ts';
import { useModels3DQuery } from '@/app/api/models-3d.ts';
import {
  useOrganizationQuery,
  useOrgMembersQuery,
  useInviteOrgMemberMutation,
  useChangeOrgMemberRoleMutation,
  useRemoveOrgMemberMutation,
  useGetOrgSubscriptionQuery,
  useUpdateOrgStorageConfigMutation,
} from '@/app/api/organizations.ts';
import { useScenesQuery } from '@/app/api/scenes.ts';
import { useCurrentUserQuery } from '@/app/api/user.ts';
import { useMyWorkspacesQuery, useCreateWorkspaceMutation } from '@/app/api/workspaces.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import { EmptyData } from '@/widgets/EmptyData';
import { QuotaBar } from '@/widgets/QuotaBar';
import { ApiKeysTab } from './components/ApiKeysTab';
import { WebhooksTab } from './components/WebhooksTab';
import classes from './OrgDashboard.module.scss';

const ROLE_LABELS: Record<OrgMemberRole, string> = {
  [OrgMemberRole.Owner]: 'Владелец',
  [OrgMemberRole.Admin]: 'Администратор',
  [OrgMemberRole.Editor]: 'Редактор',
  [OrgMemberRole.Viewer]: 'Наблюдатель',
};

const INVITABLE_ROLES = [
  { value: OrgMemberRole.Admin, label: ROLE_LABELS[OrgMemberRole.Admin] },
  { value: OrgMemberRole.Editor, label: ROLE_LABELS[OrgMemberRole.Editor] },
  { value: OrgMemberRole.Viewer, label: ROLE_LABELS[OrgMemberRole.Viewer] },
];

export function OrgDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUserQuery();

  const { data: org, isLoading: orgLoading } = useOrganizationQuery(orgId ?? '', { skip: !orgId });
  const { data: membersPage, isLoading: membersLoading } = useOrgMembersQuery({ id: orgId ?? '' }, { skip: !orgId });
  const { data: workspaces, isLoading: wsLoading } = useMyWorkspacesQuery({ orgId: orgId ?? '' }, { skip: !orgId });
  const { data: subscriptionDetail } = useGetOrgSubscriptionQuery(orgId ?? '', { skip: !orgId });
  const { data: embedProjects, isLoading: embedLoading } = useEmbedProjectsQuery(orgId ?? '', { skip: !orgId });

  const [inviteOrgMember, { isLoading: inviting }] = useInviteOrgMemberMutation();
  const [changeOrgMemberRole] = useChangeOrgMemberRoleMutation();
  const [removeOrgMember] = useRemoveOrgMemberMutation();
  const [createWorkspace, { isLoading: creatingWs }] = useCreateWorkspaceMutation();
  const [updateStorageConfig, { isLoading: savingStorage }] = useUpdateOrgStorageConfigMutation();
  const [createEmbedProject, { isLoading: creatingEmbed }] = useCreateEmbedProjectMutation();

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>(OrgMemberRole.Viewer);

  // Create workspace modal state
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [wsName, setWsName] = useState('');

  // Create embed project modal state
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [embedName, setEmbedName] = useState('');
  const [embedType, setEmbedType] = useState<'model' | 'scene'>('model');
  const [embedModelId, setEmbedModelId] = useState<string | null>(null);
  const [embedSceneId, setEmbedSceneId] = useState<string | null>(null);
  const [embedFormError, setEmbedFormError] = useState<string | null>(null);

  const { data: modelsPage } = useModels3DQuery({ size: 100 }, { skip: !embedModalOpen });
  const { data: scenesList } = useScenesQuery({}, { skip: !embedModalOpen });

  // Storage config state
  const [storageBackend, setStorageBackend] = useState<StorageBackend>(StorageBackend.Local);
  const [s3Region, setS3Region] = useState('');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [s3Endpoint, setS3Endpoint] = useState('');

  const isOwner = (membersPage?.data ?? []).some((m) => m.userId === currentUser?.id && m.role === OrgMemberRole.Owner);
  const isAdmin = (membersPage?.data ?? []).some(
    (m) => m.userId === currentUser?.id && (m.role === OrgMemberRole.Owner || m.role === OrgMemberRole.Admin),
  );

  async function handleInvite() {
    if (!orgId || !inviteEmail.trim()) return;
    await inviteOrgMember({ id: orgId, body: { email: inviteEmail.trim(), role: inviteRole } });
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole(OrgMemberRole.Viewer);
  }

  async function handleCreateWorkspace() {
    if (!orgId || !wsName.trim()) return;
    await createWorkspace({ name: wsName.trim(), orgId });
    setWsModalOpen(false);
    setWsName('');
  }

  async function handleCreateEmbedProject() {
    if (!orgId || !embedName.trim()) return;
    if (embedType === 'model' && !embedModelId) {
      setEmbedFormError('Выберите модель');
      return;
    }
    if (embedType === 'scene' && !embedSceneId) {
      setEmbedFormError('Выберите сцену');
      return;
    }
    setEmbedFormError(null);
    await createEmbedProject({
      orgId,
      name: embedName.trim(),
      ...(embedType === 'model' ? { modelId: embedModelId ?? undefined } : { sceneId: embedSceneId ?? undefined }),
    });
    setEmbedModalOpen(false);
    setEmbedName('');
    setEmbedType('model');
    setEmbedModelId(null);
    setEmbedSceneId(null);
  }

  async function handleSaveStorageConfig() {
    if (!orgId) return;
    await updateStorageConfig({
      id: orgId,
      body: {
        storageBackend,
        ...(storageBackend === StorageBackend.S3
          ? {
              s3Config: {
                region: s3Region.trim(),
                bucket: s3Bucket.trim(),
                accessKeyId: s3AccessKey.trim(),
                secretAccessKey: s3SecretKey.trim(),
                ...(s3Endpoint.trim() ? { endpoint: s3Endpoint.trim() } : {}),
              },
            }
          : {}),
      },
    });
  }

  if (orgLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!org) {
    return (
      <Center py="xl">
        <Text c="dimmed">Организация не найдена</Text>
      </Center>
    );
  }

  const subscription = org.subscription;
  const usedBytes = subscriptionDetail?.storageUsedBytes ?? 0;
  const limitBytes = subscription?.storageLimitBytes ? Number(subscription.storageLimitBytes) : null;

  return (
    <Stack gap="lg" p="md">
      {/* Header */}
      <div className={classes.header}>
        <div>
          <Group gap="xs" align="center">
            <Title order={2}>{org.name}</Title>
            <Badge variant="light" color="blue">
              {org.planType}
            </Badge>
          </Group>
          <Text c="dimmed" size="sm">
            {org.slug}
          </Text>
        </div>
        {subscription && (
          <div className={classes.quotaWrap}>
            <QuotaBar used={usedBytes} limit={limitBytes} unit="bytes" label="Хранилище" />
          </div>
        )}
      </div>

      <Tabs defaultValue="members">
        <Tabs.List>
          <Tabs.Tab value="members">Участники</Tabs.Tab>
          <Tabs.Tab value="workspaces">Рабочие пространства</Tabs.Tab>
          <Tabs.Tab value="embed">Embed</Tabs.Tab>
          {isAdmin && <Tabs.Tab value="webhooks">Webhooks</Tabs.Tab>}
          {isAdmin && <Tabs.Tab value="apiKeys">API-ключи</Tabs.Tab>}
          {isOwner && <Tabs.Tab value="storage">Хранилище</Tabs.Tab>}
        </Tabs.List>

        {/* Members tab */}
        <Tabs.Panel value="members" pt="md">
          <Stack gap="sm">
            <Group justify="flex-end">
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                Пригласить участника
              </Button>
            </Group>

            {membersLoading ? (
              <Center>
                <Loader size="sm" />
              </Center>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Имя</Table.Th>
                    <Table.Th>Роль</Table.Th>
                    <Table.Th>Вступил</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(membersPage?.data ?? []).map((m) => (
                    <Table.Tr key={m.userId}>
                      <Table.Td>{m.email}</Table.Td>
                      <Table.Td>{[m.firstName, m.lastName].filter(Boolean).join(' ') || '—'}</Table.Td>
                      <Table.Td>{ROLE_LABELS[m.role] ?? m.role}</Table.Td>
                      <Table.Td>{new Date(m.joinedAt).toLocaleDateString()}</Table.Td>
                      <Table.Td>
                        {m.role !== OrgMemberRole.Owner && (
                          <Menu position="bottom-end" width={160}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" size="sm">
                                <IconDots size={14} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              {INVITABLE_ROLES.map((r) => (
                                <Menu.Item
                                  key={r.value}
                                  disabled={m.role === r.value}
                                  leftSection={<IconUserEdit size={14} />}
                                  onClick={() =>
                                    orgId &&
                                    changeOrgMemberRole({
                                      id: orgId,
                                      userId: m.userId,
                                      body: { role: r.value },
                                    })
                                  }
                                >
                                  {r.label}
                                </Menu.Item>
                              ))}
                              <Divider />
                              <Menu.Item
                                c="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => orgId && removeOrgMember({ id: orgId, userId: m.userId })}
                              >
                                Удалить
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Workspaces tab */}
        <Tabs.Panel value="workspaces" pt="md">
          <Stack gap="sm">
            <Group justify="flex-end">
              <Button size="sm" onClick={() => setWsModalOpen(true)}>
                Создать пространство
              </Button>
            </Group>

            {wsLoading ? (
              <Center>
                <Loader size="sm" />
              </Center>
            ) : (workspaces ?? []).length === 0 ? (
              <Center py="xl">
                <Text c="dimmed">Нет рабочих пространств</Text>
              </Center>
            ) : (
              <Group gap="md">
                {(workspaces ?? []).map((ws) => (
                  <Card
                    key={ws.id}
                    p="md"
                    withBorder
                    component={Link}
                    to={buildAbsolutePath([RouterPaths.Org, orgId ?? '', RouterPaths.WorkspaceSeg, ws.id])}
                    style={{ textDecoration: 'none', minWidth: 200 }}
                  >
                    <Text fw={600}>{ws.name}</Text>
                    <Text size="xs" c="dimmed">
                      {ws.memberCount} участн.
                    </Text>
                  </Card>
                ))}
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Embed projects tab */}
        <Tabs.Panel value="embed" pt="md">
          <Stack gap="sm">
            <Group justify="flex-end">
              <Button size="sm" onClick={() => setEmbedModalOpen(true)}>
                Создать embed-проект
              </Button>
            </Group>
            {embedLoading ? (
              <Center>
                <Loader size="sm" />
              </Center>
            ) : (embedProjects ?? []).length === 0 ? (
              <Stack align="center" py="xl" gap="md">
                <EmptyData label="Создайте свой первый проект встраивания" width={160} height={100} />
                <Button leftSection={<IconPlus size={16} />} onClick={() => setEmbedModalOpen(true)}>
                  Новое встраивание
                </Button>
              </Stack>
            ) : (
              <Group gap="md">
                {(embedProjects ?? []).map((ep) => (
                  <Card
                    key={ep.id}
                    p="md"
                    withBorder
                    style={{ cursor: 'pointer', minWidth: 200 }}
                    onClick={() =>
                      navigate(buildAbsolutePath([RouterPaths.Org, orgId ?? '', RouterPaths.Embed, ep.id]))
                    }
                  >
                    <Text fw={600}>{ep.name}</Text>
                    <Text size="xs" c="dimmed">
                      {ep.allowedOrigins.length} доменов
                    </Text>
                  </Card>
                ))}
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Webhooks tab — Admin/Owner only */}
        {isAdmin && orgId && (
          <Tabs.Panel value="webhooks" pt="md">
            <WebhooksTab orgId={orgId} />
          </Tabs.Panel>
        )}

        {/* API Keys tab — Admin/Owner only */}
        {isAdmin && orgId && (
          <Tabs.Panel value="apiKeys" pt="md">
            <ApiKeysTab orgId={orgId} />
          </Tabs.Panel>
        )}

        {/* Storage settings tab — Owner only */}
        {isOwner && (
          <Tabs.Panel value="storage" pt="md">
            <Stack gap="sm" maw={480}>
              <Text fw={600}>Бэкенд хранилища</Text>
              <Select
                label="Тип хранилища"
                data={[
                  { value: StorageBackend.Local, label: 'Локальное (по умолчанию)' },
                  { value: StorageBackend.S3, label: 'S3-совместимое' },
                ]}
                value={storageBackend}
                onChange={(v) => v && setStorageBackend(v as StorageBackend)}
              />
              {storageBackend === StorageBackend.S3 && (
                <>
                  <TextInput
                    label="Регион"
                    placeholder="us-east-1"
                    value={s3Region}
                    onChange={(e) => setS3Region(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Бакет"
                    placeholder="my-bucket"
                    value={s3Bucket}
                    onChange={(e) => setS3Bucket(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Access Key ID"
                    value={s3AccessKey}
                    onChange={(e) => setS3AccessKey(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Secret Access Key"
                    type="password"
                    value={s3SecretKey}
                    onChange={(e) => setS3SecretKey(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Эндпоинт (опционально)"
                    placeholder="https://s3.example.com"
                    value={s3Endpoint}
                    onChange={(e) => setS3Endpoint(e.currentTarget.value)}
                  />
                </>
              )}
              <Button onClick={handleSaveStorageConfig} loading={savingStorage} mt="xs">
                Сохранить
              </Button>
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>

      {/* Invite modal */}
      <Modal opened={inviteOpen} onClose={() => setInviteOpen(false)} title="Пригласить участника">
        <Stack gap="sm">
          <TextInput
            label="Email"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.currentTarget.value)}
          />
          <Select
            label="Роль"
            data={INVITABLE_ROLES}
            value={inviteRole}
            onChange={(v) => v && setInviteRole(v as OrgMemberRole)}
          />
          <Button onClick={handleInvite} loading={inviting}>
            Пригласить
          </Button>
        </Stack>
      </Modal>

      {/* Create workspace modal */}
      <Modal opened={wsModalOpen} onClose={() => setWsModalOpen(false)} title="Создать рабочее пространство">
        <Stack gap="sm">
          <TextInput
            label="Название"
            placeholder="My Workspace"
            value={wsName}
            onChange={(e) => setWsName(e.currentTarget.value)}
          />
          <Button onClick={handleCreateWorkspace} loading={creatingWs}>
            Создать
          </Button>
        </Stack>
      </Modal>
      {/* Create embed project modal */}
      <Modal opened={embedModalOpen} onClose={() => setEmbedModalOpen(false)} title="Создать embed-проект">
        <Stack gap="sm">
          <TextInput
            label="Название"
            placeholder="My Embed"
            value={embedName}
            onChange={(e) => setEmbedName(e.currentTarget.value)}
          />
          <Radio.Group
            label="Тип встраивания"
            value={embedType}
            onChange={(v) => {
              setEmbedType(v as 'model' | 'scene');
              setEmbedFormError(null);
            }}
          >
            <SimpleGrid cols={2} mt="xs">
              <Radio.Card value="model" p="md" radius="md">
                <Group wrap="nowrap" align="flex-start">
                  <Radio.Indicator />
                  <Stack gap={4}>
                    <IconCube size={24} />
                    <Text fw={600} size="sm">
                      3D-модель
                    </Text>
                    <Text size="xs" c="dimmed">
                      Встроить одну модель
                    </Text>
                  </Stack>
                </Group>
              </Radio.Card>
              <Radio.Card value="scene" p="md" radius="md">
                <Group wrap="nowrap" align="flex-start">
                  <Radio.Indicator />
                  <Stack gap={4}>
                    <IconMovie size={24} />
                    <Text fw={600} size="sm">
                      Сцена
                    </Text>
                    <Text size="xs" c="dimmed">
                      Встроить составленную сцену
                    </Text>
                  </Stack>
                </Group>
              </Radio.Card>
            </SimpleGrid>
          </Radio.Group>
          {embedType === 'model' ? (
            <Select
              label="Модель"
              placeholder="Выберите модель"
              searchable
              data={(modelsPage?.data ?? []).map((m) => ({ value: m.id, label: m.name }))}
              value={embedModelId}
              onChange={(v) => {
                setEmbedModelId(v);
                setEmbedFormError(null);
              }}
            />
          ) : (
            <Select
              label="Сцена"
              placeholder="Выберите сцену"
              searchable
              data={(scenesList ?? []).map((s) => ({ value: s.id, label: s.name }))}
              value={embedSceneId}
              onChange={(v) => {
                setEmbedSceneId(v);
                setEmbedFormError(null);
              }}
            />
          )}
          {embedFormError && (
            <Text c="red" size="xs">
              {embedFormError}
            </Text>
          )}
          <Button onClick={handleCreateEmbedProject} loading={creatingEmbed}>
            Создать
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
