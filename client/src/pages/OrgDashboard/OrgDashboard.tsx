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
    Select,
    Stack,
    Table,
    Tabs,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconDots, IconTrash, IconUserEdit } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OrgMemberRole } from '@/app/api/dto.ts';
import {
    useOrganizationQuery,
    useOrgMembersQuery,
    useInviteOrgMemberMutation,
    useChangeOrgMemberRoleMutation,
    useRemoveOrgMemberMutation,
} from '@/app/api/organizations.ts';
import { useMyWorkspacesQuery, useCreateWorkspaceMutation } from '@/app/api/workspaces.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import { QuotaBar } from '@/widgets/QuotaBar';
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

    const { data: org, isLoading: orgLoading } = useOrganizationQuery(orgId ?? '', { skip: !orgId });
    const { data: membersPage, isLoading: membersLoading } = useOrgMembersQuery({ id: orgId ?? '' }, { skip: !orgId });
    const { data: workspaces, isLoading: wsLoading } = useMyWorkspacesQuery({ orgId: orgId ?? '' }, { skip: !orgId });

    const [inviteOrgMember, { isLoading: inviting }] = useInviteOrgMemberMutation();
    const [changeOrgMemberRole] = useChangeOrgMemberRoleMutation();
    const [removeOrgMember] = useRemoveOrgMemberMutation();
    const [createWorkspace, { isLoading: creatingWs }] = useCreateWorkspaceMutation();

    // Invite modal state
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<OrgMemberRole>(OrgMemberRole.Viewer);

    // Create workspace modal state
    const [wsModalOpen, setWsModalOpen] = useState(false);
    const [wsName, setWsName] = useState('');

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
    const usedBytes = 0; // placeholder until StorageQuota module (STEP-7)
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
        </Stack>
    );
}
