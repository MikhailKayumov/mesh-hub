import {
    ActionIcon,
    AspectRatio,
    Badge,
    Button,
    Card,
    Center,
    Group,
    Image,
    Menu,
    Modal,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconDots,
    IconEye,
    IconEyeOff,
    IconLink,
    IconMovie,
    IconPlayerPlay,
    IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteSceneMutation, useScenesQuery, useUpdateSceneMutation } from '@/app/api/scenes.ts';
import { SceneListItemResponseDto, SceneVisibility, SceneVisibilityType } from '@/app/api/dto.ts';
import { useDocumentTitle } from '@/shared/hooks';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import { EmptyData } from '@/widgets/EmptyData';
import { CreateSceneModal } from '@/pages/Scenes/CreateSceneModal';

const VISIBILITY_COLOR: Record<SceneVisibilityType, string> = {
    [SceneVisibility.Public]: 'green',
    [SceneVisibility.Private]: 'gray',
    [SceneVisibility.Unlisted]: 'yellow',
};

const VISIBILITY_LABEL: Record<SceneVisibilityType, string> = {
    [SceneVisibility.Public]: 'Публичная',
    [SceneVisibility.Private]: 'Приватная',
    [SceneVisibility.Unlisted]: 'Скрытая',
};

function formatRelative(dateStr: string): string {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 2) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч. назад`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} д. назад`;
    return date.toLocaleDateString('ru-RU');
}

interface SceneCardProps {
    scene: SceneListItemResponseDto;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
    onVisibilityChange: (id: string, visibility: SceneVisibilityType) => void;
}

function SceneCard({ scene, onOpen, onDelete, onVisibilityChange }: SceneCardProps) {
    const [deleteConfirmOpened, { open: openDeleteConfirm, close: closeDeleteConfirm }] = useDisclosure(false);

    const modifiedAt = scene.updatedAt ?? scene.createdAt;

    return (
        <>
            <Card shadow="sm" radius="md" withBorder>
                <Card.Section style={{ cursor: 'pointer' }} onClick={() => onOpen(scene.id)}>
                    <AspectRatio ratio={16 / 9}>
                        {scene.thumbnailPath ? (
                            <Image src={scene.thumbnailPath} alt={scene.name} />
                        ) : (
                            <Center bg="dark.8">
                                <IconMovie size={40} color="var(--mantine-color-dimmed)" />
                            </Center>
                        )}
                    </AspectRatio>
                </Card.Section>

                <Stack gap={6} mt="sm">
                    <Group justify="space-between" wrap="nowrap" align="flex-start">
                        <Text fw={600} lineClamp={1} style={{ flex: 1 }}>
                            {scene.name}
                        </Text>
                        <Menu withinPortal position="bottom-end" shadow="md">
                            <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="sm">
                                    <IconDots size={16} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item leftSection={<IconPlayerPlay size={14} />} onClick={() => onOpen(scene.id)}>
                                    Открыть в редакторе
                                </Menu.Item>

                                <Menu.Divider />

                                <Menu.Label>Видимость</Menu.Label>
                                <Menu.Item
                                    leftSection={<IconEye size={14} />}
                                    disabled={scene.visibility === SceneVisibility.Public}
                                    onClick={() => onVisibilityChange(scene.id, SceneVisibility.Public)}
                                >
                                    Публичная
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconLink size={14} />}
                                    disabled={scene.visibility === SceneVisibility.Unlisted}
                                    onClick={() => onVisibilityChange(scene.id, SceneVisibility.Unlisted)}
                                >
                                    Скрытая (по ссылке)
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconEyeOff size={14} />}
                                    disabled={scene.visibility === SceneVisibility.Private}
                                    onClick={() => onVisibilityChange(scene.id, SceneVisibility.Private)}
                                >
                                    Приватная
                                </Menu.Item>

                                <Menu.Divider />

                                <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={openDeleteConfirm}>
                                    Удалить
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>

                    <Group gap={6}>
                        <Badge
                            size="xs"
                            variant="light"
                            color={VISIBILITY_COLOR[scene.visibility]}
                        >
                            {VISIBILITY_LABEL[scene.visibility]}
                        </Badge>
                    </Group>

                    <Text size="xs" c="dimmed">
                        {scene.objectCount} объект{scene.objectCount === 1 ? '' : scene.objectCount >= 2 && scene.objectCount <= 4 ? 'а' : 'ов'} · Изменено {formatRelative(modifiedAt)}
                    </Text>
                </Stack>
            </Card>

            <Modal opened={deleteConfirmOpened} onClose={closeDeleteConfirm} title="Удалить сцену?" size="sm" centered>
                <Text size="sm">Сцена «{scene.name}» будет удалена без возможности восстановления.</Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={closeDeleteConfirm}>
                        Отмена
                    </Button>
                    <Button
                        color="red"
                        onClick={() => {
                            onDelete(scene.id);
                            closeDeleteConfirm();
                        }}
                    >
                        Удалить
                    </Button>
                </Group>
            </Modal>
        </>
    );
}

export function UserScenesPage() {
    useDocumentTitle('Мои сцены');

    const navigate = useNavigate();
    const [opened, { open, close }] = useDisclosure(false);

    const { data: scenes, isLoading } = useScenesQuery({ userId: 'me' });
    const [deleteScene] = useDeleteSceneMutation();
    const [updateScene] = useUpdateSceneMutation();

    const handleOpen = (sceneId: string) => {
        navigate(buildAbsolutePath([RouterPaths.User, RouterPaths.UserScenes, sceneId]));
    };

    const handleDelete = (sceneId: string) => {
        deleteScene({ sceneId });
    };

    const handleVisibilityChange = (sceneId: string, visibility: SceneVisibilityType) => {
        updateScene({ sceneId, body: { visibility } });
    };

    return (
        <Stack p="lg">
            <Group justify="space-between">
                <Title order={2}>Мои сцены</Title>
                <Button onClick={open}>Создать сцену</Button>
            </Group>

            {isLoading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} height={220} radius="md" />
                    ))}
                </SimpleGrid>
            ) : !scenes?.length ? (
                <Stack align="center" py="xl" gap="md">
                    <EmptyData label="У вас ещё нет сцен" width={180} height={120} />
                    <Button onClick={open}>Создать сцену</Button>
                </Stack>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                    {scenes.map((scene) => (
                        <SceneCard
                            key={scene.id}
                            scene={scene}
                            onOpen={handleOpen}
                            onDelete={handleDelete}
                            onVisibilityChange={handleVisibilityChange}
                        />
                    ))}
                </SimpleGrid>
            )}

            <CreateSceneModal
                opened={opened}
                onClose={close}
                onCreated={(id) => {
                    close();
                    navigate(buildAbsolutePath([RouterPaths.User, RouterPaths.UserScenes, id]));
                }}
            />
        </Stack>
    );
}
