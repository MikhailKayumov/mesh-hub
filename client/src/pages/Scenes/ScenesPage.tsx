import { Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/shared/hooks';
import { RouterPaths } from '@/shared/router/paths.ts';
import { useScenesQuery } from '@/app/api/scenes.ts';
import { CreateSceneModal } from './CreateSceneModal';

export function ScenesPage() {
    useDocumentTitle('Scenes');

    const { orgId, workspaceId } = useParams<{ orgId: string; workspaceId: string }>();
    const navigate = useNavigate();
    const [opened, { open, close }] = useDisclosure(false);

    const { data: scenes, isLoading } = useScenesQuery({ workspaceId: workspaceId! }, { skip: !workspaceId });

    const handleSceneClick = (sceneId: string) => {
        navigate(
            `/${RouterPaths.Org}/${orgId}/${RouterPaths.WorkspaceSeg}/${workspaceId}/${RouterPaths.Scenes}/${sceneId}`,
        );
    };

    return (
        <Stack p="lg">
            <Group justify="space-between">
                <Title order={2}>Scenes</Title>
                <Button onClick={open}>New Scene</Button>
            </Group>

            {isLoading ? (
                <Center h={200}>
                    <Loader />
                </Center>
            ) : !scenes?.length ? (
                <Center h={200}>
                    <Text c="dimmed">No scenes yet. Create your first scene.</Text>
                </Center>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                    {scenes.map((scene) => (
                        <Card
                            key={scene.id}
                            shadow="sm"
                            padding="md"
                            radius="md"
                            withBorder
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSceneClick(scene.id)}
                        >
                            {scene.thumbnailPath ? (
                                <Card.Section>
                                    <img
                                        src={scene.thumbnailPath}
                                        alt={scene.name}
                                        style={{ width: '100%', height: 160, objectFit: 'cover' }}
                                    />
                                </Card.Section>
                            ) : (
                                <Center h={160} bg="dark.8" style={{ borderRadius: 6 }}>
                                    <Text c="dimmed" size="sm">
                                        No preview
                                    </Text>
                                </Center>
                            )}
                            <Stack gap={4} mt="md">
                                <Text fw={600} lineClamp={1}>
                                    {scene.name}
                                </Text>
                                {scene.description && (
                                    <Text size="sm" c="dimmed" lineClamp={2}>
                                        {scene.description}
                                    </Text>
                                )}
                                <Text size="xs" c="dimmed">
                                    {scene.objectCount} object{scene.objectCount !== 1 ? 's' : ''}
                                </Text>
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>
            )}

            <CreateSceneModal
                workspaceId={workspaceId!}
                opened={opened}
                onClose={close}
                onCreated={(sceneId) => {
                    close();
                    handleSceneClick(sceneId);
                }}
            />
        </Stack>
    );
}
