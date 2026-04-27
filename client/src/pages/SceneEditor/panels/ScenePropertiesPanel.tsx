import { Box, Divider, NumberInput, Stack, Text, Title } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import type { SceneObjectResponseDto, SceneResponseDto } from '@/app/api/dto.ts';
import { useUpdateSceneObjectMutation } from '@/app/api/scenes.ts';

interface Props {
    scene: SceneResponseDto;
    selectedObjectId: string | null;
}

function ObjectTransformPanel({
    sceneId,
    object,
}: {
    sceneId: string;
    object: SceneObjectResponseDto;
}) {
    const [updateObject] = useUpdateSceneObjectMutation();

    const update = useDebouncedCallback((field: string, value: number) => {
        updateObject({ sceneId, objectId: object.id, body: { [field]: value } });
    }, 400);

    const field = (label: string, key: keyof SceneObjectResponseDto) => (
        <NumberInput
            label={label}
            size="xs"
            defaultValue={object[key] as number}
            step={0.01}
            decimalScale={3}
            onChange={(v) => update(key, typeof v === 'number' ? v : 0)}
        />
    );

    return (
        <Stack gap="xs">
            <Text size="sm" fw={600} c="dimmed">
                {object.model.name}
            </Text>
            <Divider label="Position" labelPosition="left" />
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {field('X', 'posX')}
                {field('Y', 'posY')}
                {field('Z', 'posZ')}
            </Box>
            <Divider label="Rotation" labelPosition="left" />
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {field('X', 'rotX')}
                {field('Y', 'rotY')}
                {field('Z', 'rotZ')}
            </Box>
            <Divider label="Scale" labelPosition="left" />
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {field('X', 'scaleX')}
                {field('Y', 'scaleY')}
                {field('Z', 'scaleZ')}
            </Box>
        </Stack>
    );
}

export function ScenePropertiesPanel({ scene, selectedObjectId }: Props) {
    const selectedObject = scene.objects.find((o) => o.id === selectedObjectId);

    return (
        <Stack gap="xs" h="100%">
            <Title order={5} px={4} pt={4}>
                Properties
            </Title>
            {selectedObject ? (
                <ObjectTransformPanel sceneId={scene.id} object={selectedObject} />
            ) : (
                <Text size="sm" c="dimmed" px={4}>
                    Select an object to edit its properties.
                </Text>
            )}
        </Stack>
    );
}
