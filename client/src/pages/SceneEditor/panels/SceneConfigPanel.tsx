import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  ColorInput,
  Divider,
  Group,
  LoadingOverlay,
  Select,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconCloudUpload, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import { useUpdateSceneMutation, useUploadSceneHdriMutation } from '@/app/api/scenes.ts';
import { NumberInputSlider } from '@/widgets/NumberInputSlider';

const HDRI_SERVE_PATH = (sceneId: string) => `/api/scenes/${sceneId}/hdri`;
const MAX_HDRI_SIZE = 20 * 1024 * 1024; // 20 MB

interface FogState {
  enabled: boolean;
  type: 'linear' | 'exp2';
  color: string;
  near: number;
  far: number;
}

const DEFAULT_FOG: FogState = {
  enabled: false,
  type: 'linear',
  color: '#cccccc',
  near: 10,
  far: 100,
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface Props {
  scene: SceneResponseDto;
  updateBackgroundColor: (hex: string) => void;
  updateAmbientLight: (intensity: number) => void;
  loadHdri: (url: string) => void;
}

export function SceneConfigPanel({ scene, updateBackgroundColor, updateAmbientLight, loadHdri }: Props) {
  const [updateScene, { isLoading: isSavingScene }] = useUpdateSceneMutation();
  const [uploadHdri, { isLoading: isUploadingHdri }] = useUploadSceneHdriMutation();

  const config = scene.config ?? {
    backgroundColor: '#000000',
    ambientLightIntensity: 0.5,
    environmentHdriPath: undefined,
  };

  // --- Background color ---
  const [bgColor, setBgColor] = useState(config.backgroundColor);
  const debouncedBgColor = useDebounce(bgColor, 400);

  useEffect(() => {
    if (debouncedBgColor === config.backgroundColor) return;
    updateBackgroundColor(debouncedBgColor);
    updateScene({ sceneId: scene.id, body: { config: { backgroundColor: debouncedBgColor } } }).catch(() => {
      notifications.show({ color: 'red', title: 'Error', message: 'Failed to save background color' });
    });
  }, [debouncedBgColor]);

  // --- Ambient light ---
  const [ambientIntensity, setAmbientIntensity] = useState(config.ambientLightIntensity);
  const debouncedAmbient = useDebounce(ambientIntensity, 400);

  useEffect(() => {
    if (debouncedAmbient === config.ambientLightIntensity) return;
    updateAmbientLight(debouncedAmbient);
    updateScene({ sceneId: scene.id, body: { config: { ambientLightIntensity: debouncedAmbient } } }).catch(() => {
      notifications.show({ color: 'red', title: 'Error', message: 'Failed to save ambient intensity' });
    });
  }, [debouncedAmbient]);

  // --- HDRI upload ---
  const hasHdri = Boolean(config.environmentHdriPath);

  const handleHdriDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        await uploadHdri({ sceneId: scene.id, formData }).unwrap();
        const url = HDRI_SERVE_PATH(scene.id);
        loadHdri(url);
        notifications.show({ color: 'green', title: 'HDRI uploaded', message: file.name });
      } catch (err: any) {
        notifications.show({
          color: 'red',
          title: 'Upload failed',
          message: err?.data?.message ?? 'Failed to upload HDRI',
        });
      }
    },
    [scene.id, uploadHdri, loadHdri],
  );

  const handleRemoveHdri = async () => {
    try {
      await updateScene({ sceneId: scene.id, body: { config: { environmentHdriPath: undefined } } }).unwrap();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err?.data?.message ?? 'Failed to remove HDRI',
      });
    }
  };

  // --- Fog (local state only — DB persistence in ITER-3) ---
  const [fog, setFog] = useState<FogState>(DEFAULT_FOG);
  const setFogField = <K extends keyof FogState>(key: K, value: FogState[K]) => setFog((f) => ({ ...f, [key]: value }));

  return (
    <Stack gap="xs" px={4} pt={4} style={{ position: 'relative' }}>
      <LoadingOverlay visible={isSavingScene} zIndex={200} overlayProps={{ blur: 1 }} />

      <Divider label="Background" labelPosition="left" mt={4} />
      <ColorInput
        label="Color"
        size="xs"
        format="hex"
        value={bgColor}
        onChange={(v) => {
          setBgColor(v);
          updateBackgroundColor(v);
        }}
      />

      <Divider label="Ambient Light" labelPosition="left" />
      <NumberInputSlider
        label="Intensity"
        value={ambientIntensity}
        min={0}
        max={5}
        step={0.05}
        onChange={(v) => {
          setAmbientIntensity(v);
          updateAmbientLight(v);
        }}
      />

      <Divider label="Environment (HDRI)" labelPosition="left" />
      {hasHdri ? (
        <Group gap="xs">
          <Badge size="sm" variant="light" style={{ flex: 1, overflow: 'hidden' }}>
            hdri.hdr
          </Badge>
          <Tooltip label="Remove HDRI">
            <ActionIcon size="sm" variant="subtle" color="red" onClick={handleRemoveHdri}>
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ) : (
        <Dropzone
          onDrop={handleHdriDrop}
          accept={['.hdr', 'application/octet-stream']}
          maxSize={MAX_HDRI_SIZE}
          maxFiles={1}
          loading={isUploadingHdri}
          p="xs"
        >
          <Stack align="center" gap={4} py={4} style={{ pointerEvents: 'none' }}>
            <IconCloudUpload size={24} />
            <Text size="xs" ta="center">
              Drop .hdr file here or click to select (max 20 MB)
            </Text>
          </Stack>
        </Dropzone>
      )}

      <Divider label="Fog" labelPosition="left" />
      <Switch
        label="Enable fog"
        size="xs"
        checked={fog.enabled}
        onChange={(e) => setFogField('enabled', e.currentTarget.checked)}
      />
      <Collapse expanded={fog.enabled}>
        <Stack gap="xs">
          <Select
            label="Type"
            size="xs"
            value={fog.type}
            onChange={(v) => setFogField('type', (v as FogState['type']) ?? 'linear')}
            data={[
              { value: 'linear', label: 'Linear' },
              { value: 'exp2', label: 'Exponential²' },
            ]}
          />
          <ColorInput
            label="Color"
            size="xs"
            format="hex"
            value={fog.color}
            onChange={(v) => setFogField('color', v)}
          />
          {fog.type === 'linear' ? (
            <Group gap="xs" grow>
              <NumberInputSlider
                label="Near"
                value={fog.near}
                min={0}
                max={200}
                step={1}
                onChange={(v) => setFogField('near', v)}
              />
              <NumberInputSlider
                label="Far"
                value={fog.far}
                min={0}
                max={500}
                step={1}
                onChange={(v) => setFogField('far', v)}
              />
            </Group>
          ) : (
            <NumberInputSlider
              label="Density"
              value={fog.near}
              min={0}
              max={1}
              step={0.001}
              onChange={(v) => setFogField('near', v)}
            />
          )}
          <Button size="xs" variant="light" disabled>
            Apply (coming in ITER-3)
          </Button>
        </Stack>
      </Collapse>
    </Stack>
  );
}
