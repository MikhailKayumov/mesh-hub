import { ActionIcon, Group, ScrollArea, Stack, Text, Title, Tooltip, UnstyledButton } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import { useRemoveSceneObjectMutation } from '@/app/api/scenes.ts';

interface Props {
    scene: SceneResponseDto;
    selectedObjectId: string | null;
    onSelectObject: (id: string | null) => void;
}

export function SceneObjectsPanel({ scene, selectedObjectId, onSelectObject }: Props) {
    const [removeObject, { isLoading }] = useRemoveSceneObjectMutation();

    return (
        <Stack gap="xs" h="100%">
            <Title order={5} px={4} pt={4}>
                Objects ({scene.objects.length})
            </Title>
            <ScrollArea flex={1}>
                <Stack gap={4}>
                    {scene.objects.length === 0 ? (
                        <Text size="sm" c="dimmed" px={4}>
                            No objects in this scene.
                        </Text>
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
                                                removeObject({ sceneId: scene.id, objectId: obj.id });
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
    );
}
