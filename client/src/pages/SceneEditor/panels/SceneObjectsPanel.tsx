import { useState } from 'react';
import { ActionIcon, Group, ScrollArea, Stack, Text, Title, Tooltip, UnstyledButton } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import { useRemoveSceneObjectMutation } from '@/app/api/scenes.ts';
import { EmptyData } from '@/widgets/EmptyData';
import { AddModelToSceneModal } from './AddModelToSceneModal';

interface Props {
    scene: SceneResponseDto;
    selectedObjectId: string | null;
    onSelectObject: (id: string | null) => void;
}

export function SceneObjectsPanel({ scene, selectedObjectId, onSelectObject }: Props) {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [removeObject, { isLoading }] = useRemoveSceneObjectMutation();

    const handleRemove = (objectId: string, name: string) => {
        modals.openConfirmModal({
            title: 'Remove object',
            children: <Text size="sm">Remove <b>{name}</b> from the scene?</Text>,
            labels: { confirm: 'Remove', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await removeObject({ sceneId: scene.id, objectId }).unwrap();
                    if (selectedObjectId === objectId) onSelectObject(null);
                } catch (err: any) {
                    notifications.show({
                        color: 'red',
                        title: 'Error',
                        message: err?.data?.message ?? 'Failed to remove object',
                    });
                }
            },
        });
    };

    return (
        <>
            <Stack gap="xs" h="100%">
                <Group justify="space-between" px={4} pt={4}>
                    <Title order={5}>Objects ({scene.objects.length})</Title>
                    <Tooltip label="Add model to scene">
                        <ActionIcon size="sm" variant="subtle" onClick={() => setAddModalOpen(true)}>
                            <IconPlus size={14} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
                <ScrollArea flex={1}>
                    <Stack gap={4}>
                        {scene.objects.length === 0 ? (
                            <Stack align="center" py="md">
                                <EmptyData label="No objects in this scene." />
                            </Stack>
                        ) : (
                            scene.objects.map((obj) => (
                                <UnstyledButton
                                    key={obj.id}
                                    onClick={() => onSelectObject(selectedObjectId === obj.id ? null : obj.id)}
                                    style={(theme) => ({
                                        padding: '6px 8px',
                                        borderRadius: theme.radius.sm,
                                        backgroundColor:
                                            selectedObjectId === obj.id
                                                ? theme.colors.dark[5]
                                                : 'transparent',
                                    })}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <Text size="sm" lineClamp={1}>
                                            {obj.model.name}
                                        </Text>
                                        <Tooltip label="Remove from scene">
                                            <ActionIcon
                                                size="sm"
                                                variant="subtle"
                                                color="red"
                                                loading={isLoading}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemove(obj.id, obj.model.name);
                                                }}
                                            >
                                                <IconTrash size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </UnstyledButton>
                            ))
                        )}
                    </Stack>
                </ScrollArea>
            </Stack>

            <AddModelToSceneModal
                opened={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                scene={scene}
            />
        </>
    );
}
