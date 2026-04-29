import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Collapse,
  ColorInput,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  rem,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconBulb, IconFocus2, IconPencil, IconPlus, IconSun, IconTargetArrow, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import {
  useAddModelLightMutation,
  useGetDisplayConfigQuery,
  useRemoveModelLightMutation,
  useUpdateModelLightMutation,
} from '@/app/api/display-config.ts';
import type { ModelLightResponseDto, ModelLightUpsertDto } from '@/app/api/dto.ts';
import { EmptyData } from '@/widgets/EmptyData';
import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import { NumberInputSlider } from '@/widgets/NumberInputSlider';

type LightType = 'directional' | 'point' | 'spot';

const LIGHT_TYPE_ICONS: Record<string, React.ReactNode> = {
  directional: <IconSun size={14} />,
  point: <IconBulb size={14} />,
  spot: <IconTargetArrow size={14} />,
};

interface LightFormState {
  type: LightType;
  color: string;
  intensity: number;
  posX: number;
  posY: number;
  posZ: number;
  castShadow: boolean;
}

const DEFAULT_FORM: LightFormState = {
  type: 'directional',
  color: '#ffffff',
  intensity: 1,
  posX: 0,
  posY: 3,
  posZ: 0,
  castShadow: true,
};

function formFromDto(dto: ModelLightResponseDto): LightFormState {
  return {
    type: dto.type as LightType,
    color: dto.color,
    intensity: dto.intensity,
    posX: dto.posX,
    posY: dto.posY,
    posZ: dto.posZ,
    castShadow: dto.castShadow,
  };
}

interface LightFormProps {
  initial: LightFormState;
  onSave: (form: LightFormState) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function LightForm({ initial, onSave, onCancel, isSaving }: LightFormProps) {
  const [form, setForm] = useState<LightFormState>(initial);
  const set = <K extends keyof LightFormState>(key: K, value: LightFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Paper p="xs" withBorder style={{ position: 'relative' }}>
      <LoadingOverlay visible={isSaving} zIndex={1000} overlayProps={{ blur: 2 }} />
      <Stack gap="xs">
        <Select
          label="Type"
          size="xs"
          value={form.type}
          onChange={(v) => set('type', (v as LightType) ?? 'directional')}
          data={[
            { value: 'directional', label: 'Directional' },
            { value: 'point', label: 'Point' },
            { value: 'spot', label: 'Spot' },
          ]}
        />
        <ColorInput
          label="Color"
          size="xs"
          value={form.color}
          onChange={(v) => set('color', v)}
          eyeDropperIcon={<IconFocus2 style={{ width: rem(14), height: rem(14) }} />}
          format="hex"
          fixOnBlur
        />
        <NumberInputSlider
          label="Intensity"
          value={form.intensity}
          min={0}
          max={10}
          step={0.1}
          onChange={(v) => set('intensity', v)}
        />
        <Divider label="Position" labelPosition="left" />
        <Group gap="xs" grow>
          {(['posX', 'posY', 'posZ'] as const).map((axis) => (
            <NumberInputSlider
              key={axis}
              label={axis.slice(-1).toUpperCase()}
              value={form[axis]}
              min={-50}
              max={50}
              step={0.1}
              onChange={(v) => set(axis, v)}
            />
          ))}
        </Group>
        <Switch
          label="Cast shadow"
          size="xs"
          checked={form.castShadow}
          onChange={(e) => set('castShadow', e.currentTarget.checked)}
        />
        <Group gap="xs" justify="flex-end">
          <Button size="xs" variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="xs" onClick={() => onSave(form)}>
            Save
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

interface LightsTabProps {
  className?: string;
  viewer: Viewer | null;
  modelId?: string;
}

export function LightsTab({ viewer, modelId }: LightsTabProps) {
  const skip = !modelId;
  const { data: config, isFetching } = useGetDisplayConfigQuery({ modelId: modelId! }, { skip });

  const [addLight, { isLoading: isAdding }] = useAddModelLightMutation();
  const [updateLight, { isLoading: isUpdating }] = useUpdateModelLightMutation();
  const [removeLight, { isLoading: isRemoving }] = useRemoveModelLightMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isMutating = isAdding || isUpdating || isRemoving;
  const lights = config?.lights ?? [];

  const syncViewerLights = (updatedLights: ModelLightResponseDto[]) => {
    if (!viewer) return;
    viewer.world.syncLights(updatedLights as any);
  };

  const handleAdd = async (form: LightFormState) => {
    if (!modelId) return;
    const dto: ModelLightUpsertDto = { ...form, type: form.type as any };
    try {
      await addLight({ modelId, dto }).unwrap();
      setAddOpen(false);
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Error', message: err?.data?.message ?? 'Failed to add light' });
    }
  };

  const handleUpdate = async (lightId: string, form: LightFormState) => {
    if (!modelId) return;
    const dto = { ...form, type: form.type as any };
    try {
      await updateLight({ modelId, lightId, dto }).unwrap();
      setEditingId(null);
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Error', message: err?.data?.message ?? 'Failed to update light' });
    }
  };

  const handleRemove = (light: ModelLightResponseDto) => {
    if (!modelId) return;
    modals.openConfirmModal({
      title: 'Delete light',
      children: (
        <Text size="sm">
          Delete this <b>{light.type}</b> light?
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await removeLight({ modelId: modelId!, lightId: light.id }).unwrap();
          syncViewerLights(lights.filter((l) => l.id !== light.id));
        } catch (err: any) {
          notifications.show({
            color: 'red',
            title: 'Error',
            message: err?.data?.message ?? 'Failed to delete light',
          });
        }
      },
    });
  };

  return (
    <Stack gap="xs" h="100%" style={{ position: 'relative' }}>
      <LoadingOverlay visible={isMutating || isFetching} zIndex={500} overlayProps={{ blur: 1 }} />

      <Group justify="space-between" px={4} pt={4}>
        <Title order={5}>Lights ({lights.length})</Title>
        <Tooltip label="Add light">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => {
              setAddOpen((o) => !o);
              setEditingId(null);
            }}
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Collapse expanded={addOpen}>
        <Box px={4}>
          <LightForm initial={DEFAULT_FORM} onSave={handleAdd} onCancel={() => setAddOpen(false)} isSaving={isAdding} />
        </Box>
      </Collapse>

      <ScrollArea flex={1} px={4}>
        <Stack gap={4}>
          {lights.length === 0 && !addOpen ? (
            <Stack align="center" py="md">
              <EmptyData label="No lights added" />
              <Button size="xs" variant="light" leftSection={<IconPlus size={12} />} onClick={() => setAddOpen(true)}>
                Add light
              </Button>
            </Stack>
          ) : (
            lights.map((light) => (
              <Stack key={light.id} gap={0}>
                <Paper p="xs" withBorder>
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      <Box
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: light.color,
                          border: '1px solid rgba(255,255,255,0.2)',
                          flexShrink: 0,
                        }}
                      />
                      {LIGHT_TYPE_ICONS[light.type] ?? <IconBulb size={14} />}
                      <Text size="xs" tt="capitalize">
                        {light.type}
                      </Text>
                      <Badge size="xs" variant="light">
                        {light.intensity.toFixed(1)}
                      </Badge>
                    </Group>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          onClick={() => {
                            setEditingId((id) => (id === light.id ? null : light.id));
                            setAddOpen(false);
                          }}
                        >
                          <IconPencil size={12} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon size="xs" variant="subtle" color="red" onClick={() => handleRemove(light)}>
                          <IconTrash size={12} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Paper>

                <Collapse expanded={editingId === light.id}>
                  <Box mt={2}>
                    <LightForm
                      initial={formFromDto(light)}
                      onSave={(form) => handleUpdate(light.id, form)}
                      onCancel={() => setEditingId(null)}
                      isSaving={isUpdating}
                    />
                  </Box>
                </Collapse>
              </Stack>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
