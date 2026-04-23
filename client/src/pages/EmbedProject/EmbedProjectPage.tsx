import { BarChart } from '@mantine/charts';
import { Button, Center, FileInput, Group, Loader, Stack, Switch, Tabs, Text, TextInput, Title } from '@mantine/core';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    useEmbedProjectsQuery,
    useUpdateEmbedProjectMutation,
    useAddEmbedDomainMutation,
    useRemoveEmbedDomainMutation,
    useEmbedAnalyticsQuery,
    useUploadEmbedLogoMutation,
} from '@/app/api/embed.ts';
import classes from './EmbedProjectPage.module.scss';

export function EmbedProjectPage() {
    const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();

    const { data: projects, isLoading } = useEmbedProjectsQuery(orgId ?? '', { skip: !orgId });
    const project = projects?.find((p) => p.id === projectId);

    const [updateProject] = useUpdateEmbedProjectMutation();
    const [addDomain] = useAddEmbedDomainMutation();
    const [removeDomain] = useRemoveEmbedDomainMutation();
    const [uploadLogo] = useUploadEmbedLogoMutation();

    const { data: analytics, isLoading: analyticsLoading } = useEmbedAnalyticsQuery(projectId ?? '', {
        skip: !projectId,
    });

    // Domains tab state
    const [newDomain, setNewDomain] = useState('');

    // Branding tab state
    const [showBadge, setShowBadge] = useState(project?.brandingConfig?.showBadge ?? true);
    const [primaryColor, setPrimaryColor] = useState(project?.brandingConfig?.primaryColor ?? '');
    const [logoFile, setLogoFile] = useState<File | null>(null);

    if (isLoading) {
        return (
            <Center py="xl">
                <Loader />
            </Center>
        );
    }

    if (!project) {
        return (
            <Center py="xl">
                <Text c="dimmed">Embed-проект не найден</Text>
            </Center>
        );
    }

    async function handleAddDomain() {
        if (!projectId || !newDomain.trim()) return;
        await addDomain({ id: projectId, domain: newDomain.trim() });
        setNewDomain('');
    }

    async function handleSaveBranding() {
        if (!projectId) return;
        if (logoFile) {
            await uploadLogo({ id: projectId, file: logoFile });
            setLogoFile(null);
        }
        await updateProject({
            id: projectId,
            body: {
                brandingConfig: {
                    showBadge,
                    primaryColor: primaryColor.trim() || undefined,
                    logoUrl: project.brandingConfig?.logoUrl,
                },
            },
        });
    }

    const chartData = (analytics?.dailyViews ?? []).map((d) => ({ date: d.date, Просмотры: d.count }));

    return (
        <Stack gap="lg" p="md">
            <Title order={3}>{project.name}</Title>

            <Tabs defaultValue="domains">
                <Tabs.List>
                    <Tabs.Tab value="domains">Домены</Tabs.Tab>
                    <Tabs.Tab value="branding">Брендинг</Tabs.Tab>
                    <Tabs.Tab value="analytics">Аналитика</Tabs.Tab>
                </Tabs.List>

                {/* Domains tab */}
                <Tabs.Panel value="domains" pt="md">
                    <Stack gap="sm" maw={480}>
                        <Group gap="xs">
                            <TextInput
                                flex={1}
                                placeholder="example.com"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.currentTarget.value)}
                            />
                            <Button onClick={handleAddDomain}>Добавить</Button>
                        </Group>
                        {project.allowedOrigins.length === 0 ? (
                            <Text c="dimmed" size="sm">
                                Нет разрешённых доменов
                            </Text>
                        ) : (
                            project.allowedOrigins.map((domain) => (
                                <Group key={domain} justify="space-between">
                                    <Text size="sm">{domain}</Text>
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        color="red"
                                        onClick={() => projectId && removeDomain({ id: projectId, domain })}
                                    >
                                        Удалить
                                    </Button>
                                </Group>
                            ))
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* Branding tab */}
                <Tabs.Panel value="branding" pt="md">
                    <Stack gap="sm" maw={480}>
                        <Switch
                            label="Показывать бейдж «Powered by MeshHub»"
                            checked={showBadge}
                            onChange={(e) => setShowBadge(e.currentTarget.checked)}
                        />
                        <TextInput
                            label="Основной цвет (hex)"
                            placeholder="#3b82f6"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.currentTarget.value)}
                        />
                        <FileInput
                            label="Логотип"
                            placeholder="Выберите изображение"
                            accept="image/*"
                            value={logoFile}
                            onChange={setLogoFile}
                        />
                        {project.brandingConfig?.logoUrl && (
                            <img src={project.brandingConfig.logoUrl} alt="Logo" className={classes.logoPreview} />
                        )}
                        <Button onClick={handleSaveBranding}>Сохранить</Button>
                    </Stack>
                </Tabs.Panel>

                {/* Analytics tab */}
                <Tabs.Panel value="analytics" pt="md">
                    {analyticsLoading ? (
                        <Center>
                            <Loader size="sm" />
                        </Center>
                    ) : (
                        <Stack gap="md">
                            <Text fw={600}>Всего просмотров: {analytics?.totalViews ?? 0}</Text>
                            {chartData.length > 0 && (
                                <BarChart h={240} data={chartData} dataKey="date" series={[{ name: 'Просмотры', color: 'blue' }]} />
                            )}
                            {(analytics?.topOrigins ?? []).length > 0 && (
                                <Stack gap="xs">
                                    <Text fw={500} size="sm">
                                        Топ источников
                                    </Text>
                                    {analytics!.topOrigins.map((o) => (
                                        <Group key={o.origin} justify="space-between">
                                            <Text size="sm">{o.origin || '(прямой)'}</Text>
                                            <Text size="sm" c="dimmed">
                                                {o.count}
                                            </Text>
                                        </Group>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    )}
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
