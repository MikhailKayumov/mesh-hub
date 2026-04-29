import { Badge, Box, ColorInput, Divider, Group, NumberInput, Paper, Stack, Switch, Text, Title } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type {
  SceneLightResponseDto,
  SceneLightUpsertDto,
  SceneObjectResponseDto,
  SceneResponseDto,
} from '@/app/api/dto.ts';
import { useUpdateSceneLightMutation, useUpdateSceneObjectMutation } from '@/app/api/scenes.ts';
import { NumberInputSlider } from '@/widgets/NumberInputSlider';
import type { SelectionState } from '../hooks/model.ts';

interface Props {
  scene: SceneResponseDto;
  selectionState: SelectionState;
  syncLights: (lights: SceneLightResponseDto[]) => void;
}

function ObjectTransformPanel({ sceneId, object }: { sceneId: string; object: SceneObjectResponseDto }) {
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

function LightPropertiesPanel({
  sceneId,
  light,
  syncLights,
}: {
  sceneId: string;
  light: SceneLightResponseDto;
  syncLights: (lights: SceneLightResponseDto[]) => void;
}) {
  const [updateLight] = useUpdateSceneLightMutation();

  const update = useDebouncedCallback((body: Partial<SceneLightUpsertDto>) => {
    updateLight({ sceneId, lightId: light.id, body })
      .unwrap()
      .then((scene) => syncLights(scene.lights))
      .catch((err: any) => {
        notifications.show({
          color: 'red',
          title: 'Error',
          message: err?.data?.message ?? 'Failed to update light',
        });
      });
  }, 400);

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" fw={600} c="dimmed" tt="capitalize">
          {light.type} Light
        </Text>
      </Group>
      <ColorInput
        label="Color"
        size="xs"
        format="hex"
        defaultValue={light.color}
        onChange={(v) => update({ color: v })}
      />
      <NumberInputSlider
        label="Intensity"
        value={light.intensity}
        min={0}
        max={10}
        step={0.1}
        onChange={(v) => update({ intensity: v })}
      />
      <Divider label="Position" labelPosition="left" />
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {(['posX', 'posY', 'posZ'] as const).map((axis) => (
          <NumberInput
            key={axis}
            label={axis.slice(-1).toUpperCase()}
            size="xs"
            defaultValue={light[axis]}
            step={0.1}
            decimalScale={2}
            onChange={(v) => update({ [axis]: typeof v === 'number' ? v : 0 })}
          />
        ))}
      </Box>
      <Switch
        label="Cast shadow"
        size="xs"
        defaultChecked={light.castShadow}
        onChange={(e) => update({ castShadow: e.currentTarget.checked })}
      />
    </Stack>
  );
}

function SceneInfoCard({ scene }: { scene: SceneResponseDto }) {
  return (
    <Paper p="sm" withBorder>
      <Stack gap="xs">
        <Text fw={600} size="sm">
          {scene.name}
        </Text>
        <Group gap="xs">
          <Badge size="sm" variant="outline" tt="capitalize">
            {scene.visibility}
          </Badge>
        </Group>
        <Divider />
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Objects
          </Text>
          <Text size="xs">{scene.objects.length}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Lights
          </Text>
          <Text size="xs">{scene.lights.length}</Text>
        </Group>
        {scene.updatedAt && (
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Last saved
            </Text>
            <Text size="xs">{new Date(scene.updatedAt).toLocaleString()}</Text>
          </Group>
        )}
        <Text size="xs" c="dimmed" mt={4}>
          Select an object or light to edit its properties.
        </Text>
      </Stack>
    </Paper>
  );
}

export function ScenePropertiesPanel({ scene, selectionState, syncLights }: Props) {
  const selectedObject =
    selectionState?.type === 'object' ? scene.objects.find((o) => o.id === selectionState.id) : undefined;
  const selectedLight =
    selectionState?.type === 'light' ? scene.lights.find((l) => l.id === selectionState.id) : undefined;

  return (
    <Stack gap="xs" h="100%" p="xs">
      <Title order={5}>Properties</Title>
      {selectedObject ? (
        <ObjectTransformPanel sceneId={scene.id} object={selectedObject} />
      ) : selectedLight ? (
        <LightPropertiesPanel sceneId={scene.id} light={selectedLight} syncLights={syncLights} />
      ) : (
        <SceneInfoCard scene={scene} />
      )}
    </Stack>
  );
}
