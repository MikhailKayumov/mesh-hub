import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Collapse,
  ColorInput,
  Divider,
  FileButton,
  Group,
  LoadingOverlay,
  rem,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCloudUpload, IconFocus2, IconMoon, IconPhoto, IconSun, IconTrash, IconWand } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  BasicShadowMap,
  CineonToneMapping,
  LinearSRGBColorSpace,
  LinearToneMapping,
  NoToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  ReinhardToneMapping,
  SRGBColorSpace,
  VSMShadowMap,
} from 'three';
import {
  useGetDisplayConfigQuery,
  useRemoveDisplayHdriMutation,
  useUpdateDisplayConfigMutation,
  useUploadDisplayHdriMutation,
} from '@/app/api/display-config.ts';
import type { DisplayConfigResponseDto, DisplayConfigUpdateDto } from '@/app/api/dto.ts';
import type { PostProcessConfig, RendererSettings } from '@/widgets/Model3DViewer/classes/types';
import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import { DISPLAY_PRESETS } from '@/widgets/Model3DViewer/constants/displayPresets.ts';
import { NumberInputSlider } from '@/widgets/NumberInputSlider';
import classes from './DisplayConfigTab.module.scss';

interface DisplayConfigTabProps {
  className?: string;
  viewer: Viewer | null;
  modelId?: string;
}

const COLOR_SPACE_OPTIONS = [
  { value: SRGBColorSpace, label: 'sRGB' },
  { value: LinearSRGBColorSpace, label: 'Linear sRGB' },
];

const TONE_MAPPING_OPTIONS = [
  { value: NoToneMapping.toString(), label: 'None' },
  { value: LinearToneMapping.toString(), label: 'Linear' },
  { value: ReinhardToneMapping.toString(), label: 'Reinhard' },
  { value: CineonToneMapping.toString(), label: 'Cineon' },
  { value: ACESFilmicToneMapping.toString(), label: 'ACES Filmic' },
  { value: AgXToneMapping.toString(), label: 'AgX' },
];

const SHADOW_MAP_OPTIONS = [
  { value: '', label: 'Disabled' },
  { value: BasicShadowMap.toString(), label: 'Basic' },
  { value: PCFShadowMap.toString(), label: 'PCF' },
  { value: PCFSoftShadowMap.toString(), label: 'PCF Soft' },
  { value: VSMShadowMap.toString(), label: 'VSM' },
];

const FOG_TYPE_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'exp2', label: 'Exponential' },
];

function applyConfigToViewer(viewer: Viewer, config: DisplayConfigResponseDto) {
  viewer.world.setBackgroundColor(config.backgroundColor);
  viewer.world.setAmbientLight(config.ambientIntensity);
  viewer.world.setFog({
    enabled: config.fogEnabled,
    type: config.fogType as 'linear' | 'exp2',
    color: config.fogColor,
    near: config.fogNear,
    far: config.fogFar,
  });

  if (config.rendererConfig) {
    viewer.renderer.setSettings(config.rendererConfig);
  }

  if (config.postProcess) {
    viewer.renderer.setPostProcessing(config.postProcess as PostProcessConfig);
  }
}

export function DisplayConfigTab({ className, viewer, modelId }: DisplayConfigTabProps) {
  const skip = !modelId;
  const { data: remoteConfig, isFetching } = useGetDisplayConfigQuery({ modelId: modelId! }, { skip });
  const [updateConfig, { isLoading: isSaving }] = useUpdateDisplayConfigMutation();
  const [uploadHdri, { isLoading: isUploadingHdri }] = useUploadDisplayHdriMutation();
  const [removeHdri, { isLoading: isRemovingHdri }] = useRemoveDisplayHdriMutation();

  // Local form state mirroring backend DTO
  const [local, setLocal] = useState<DisplayConfigResponseDto | null>(remoteConfig ?? null);
  const [isDirty, setIsDirty] = useState(false);
  const [prevRemote, setPrevRemote] = useState<DisplayConfigResponseDto | undefined>(remoteConfig);

  // Adjust state on prop change: re-seed local form whenever a new remote config arrives.
  // setState during render is supported by React and triggers a single coalesced re-render.
  if (remoteConfig !== prevRemote) {
    setPrevRemote(remoteConfig);
    setLocal(remoteConfig ?? null);
    setIsDirty(false);
  }

  // Collapse toggles for sections
  const [envOpen, { toggle: toggleEnv }] = useDisclosure(true);
  const [fogOpen, { toggle: toggleFog }] = useDisclosure(false);
  const [ppOpen, { toggle: togglePP }] = useDisclosure(false);
  const [rendererOpen, { toggle: toggleRenderer }] = useDisclosure(false);
  const [presetsOpen, { toggle: togglePresets }] = useDisclosure(false);

  // Sync to the 3D viewer (external system) — no setState, so no cascading renders.
  useEffect(() => {
    if (!remoteConfig || !viewer) return;
    applyConfigToViewer(viewer, remoteConfig);
  }, [remoteConfig, viewer]);

  const set = <K extends keyof DisplayConfigResponseDto>(key: K, value: DisplayConfigResponseDto[K]) => {
    setLocal((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      if (viewer) {
        applyConfigToViewer(viewer, next);
      }
      return next;
    });
    setIsDirty(true);
  };

  const setPostProcess = (pp: PostProcessConfig) => {
    setLocal((prev) => {
      if (!prev) return prev;
      const next = { ...prev, postProcess: pp };
      if (viewer) viewer.renderer.setPostProcessing(pp);
      return next;
    });
    setIsDirty(true);
  };

  const getPostProcess = (): PostProcessConfig => (local?.postProcess as PostProcessConfig) ?? {};

  const handleSave = async () => {
    if (!local || !modelId) return;
    const dto: DisplayConfigUpdateDto = {
      backgroundColor: local.backgroundColor,
      ambientIntensity: local.ambientIntensity,
      fogEnabled: local.fogEnabled,
      fogType: local.fogType,
      fogColor: local.fogColor,
      fogNear: local.fogNear,
      fogFar: local.fogFar,
      postProcess: local.postProcess ?? null,
      rendererConfig: local.rendererConfig ?? null,
    };
    try {
      await updateConfig({ modelId, dto }).unwrap();
      setIsDirty(false);
      notifications.show({ color: 'green', message: 'Display config saved' });
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Error', message: err?.data?.message ?? 'Failed to save' });
    }
  };

  const handleHdriUpload = async (file: File | null) => {
    if (!file || !modelId) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadHdri({ modelId, formData }).unwrap();
      notifications.show({ color: 'green', message: 'HDRI environment uploaded' });
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Error', message: err?.data?.message ?? 'Failed to upload HDRI' });
    }
  };

  const handleHdriRemove = async () => {
    if (!modelId) return;
    try {
      await removeHdri({ modelId }).unwrap();
      notifications.show({ color: 'teal', message: 'HDRI environment removed' });
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Error', message: err?.data?.message ?? 'Failed to remove HDRI' });
    }
  };

  const handleApplyPreset = (presetIndex: number) => {
    const preset = DISPLAY_PRESETS[presetIndex];
    if (!preset || !local) return;
    const next: DisplayConfigResponseDto = {
      ...local,
      backgroundColor: preset.backgroundColor ?? local.backgroundColor,
      ambientIntensity: preset.ambientIntensity ?? local.ambientIntensity,
      fogEnabled: preset.fogEnabled ?? local.fogEnabled,
      fogType: preset.fogType ?? local.fogType,
      fogColor: preset.fogColor ?? local.fogColor,
      fogNear: preset.fogNear ?? local.fogNear,
      fogFar: preset.fogFar ?? local.fogFar,
      postProcess: preset.postProcess !== undefined ? preset.postProcess : local.postProcess,
      rendererConfig: preset.rendererConfig !== undefined ? preset.rendererConfig : local.rendererConfig,
    };
    setLocal(next);
    setIsDirty(true);
    if (viewer) applyConfigToViewer(viewer, next);
  };

  const isHdriLoading = isUploadingHdri || isRemovingHdri;
  const isBusy = isFetching || isSaving || isHdriLoading;

  if (!local) {
    return (
      <Box className={clsx(classes.root, className)} style={{ position: 'relative', minHeight: 100 }}>
        <LoadingOverlay visible={isFetching} />
      </Box>
    );
  }

  const pp = getPostProcess();
  const rendererConfig = (local.rendererConfig ?? {}) as Record<string, any>;

  return (
    <ScrollArea className={clsx(classes.root, className)}>
      <Stack gap={4} p={8}>
        <LoadingOverlay visible={isBusy} zIndex={20} />

        {/* ── Presets ── */}
        <SectionHeader label="Presets" icon={<IconWand size={12} />} open={presetsOpen} onToggle={togglePresets} />
        <Collapse expanded={presetsOpen}>
          <SimpleGrid cols={2} spacing={4} pb={4}>
            {DISPLAY_PRESETS.map((preset, i) => (
              <Tooltip key={preset.label} label={preset.description} position="right" multiline w={180}>
                <Button size="compact-xs" variant="light" fullWidth onClick={() => handleApplyPreset(i)}>
                  {preset.label}
                </Button>
              </Tooltip>
            ))}
          </SimpleGrid>
        </Collapse>

        <Divider />

        {/* ── Environment ── */}
        <SectionHeader label="Environment" icon={<IconSun size={12} />} open={envOpen} onToggle={toggleEnv} />
        <Collapse expanded={envOpen}>
          <Stack gap="xs" pb={4}>
            <ColorInput
              label="Background color"
              value={local.backgroundColor}
              onChange={(v) => set('backgroundColor', v)}
              eyeDropperIcon={<IconFocus2 style={{ width: rem(14), height: rem(14) }} />}
              size="xs"
              radius="xs"
              fixOnBlur
            />
            <NumberInputSlider
              label="Ambient intensity"
              min={0}
              max={5}
              step={0.05}
              value={local.ambientIntensity}
              onChange={(v) => set('ambientIntensity', v)}
            />
            <Box>
              <Text size="xs" mb={4}>
                HDRI Environment
                {local.environmentHdriPath && (
                  <Badge size="xs" ml={6} variant="dot" color="green">
                    Active
                  </Badge>
                )}
              </Text>
              <Group gap="xs" wrap="nowrap">
                <FileButton onChange={handleHdriUpload} accept=".hdr,.exr">
                  {(props) => (
                    <Button
                      {...props}
                      size="compact-xs"
                      variant="light"
                      leftSection={<IconCloudUpload size={12} />}
                      loading={isUploadingHdri}
                      flex={1}
                    >
                      Upload HDRI
                    </Button>
                  )}
                </FileButton>
                {local.environmentHdriPath && (
                  <Tooltip label="Remove HDRI">
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      loading={isRemovingHdri}
                      onClick={handleHdriRemove}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Box>
          </Stack>
        </Collapse>

        <Divider />

        {/* ── Fog ── */}
        <SectionHeader
          label="Fog"
          icon={<IconPhoto size={12} />}
          open={fogOpen}
          onToggle={toggleFog}
          badge={local.fogEnabled ? 'On' : undefined}
        />
        <Collapse expanded={fogOpen}>
          <Stack gap="xs" pb={4}>
            <Switch
              label="Enable fog"
              size="xs"
              checked={local.fogEnabled}
              onChange={(e) => set('fogEnabled', e.currentTarget.checked)}
            />
            {local.fogEnabled && (
              <>
                <Select
                  label="Fog type"
                  size="xs"
                  radius="xs"
                  data={FOG_TYPE_OPTIONS}
                  value={local.fogType}
                  onChange={(v) => set('fogType', (v as 'linear' | 'exp2') ?? 'linear')}
                />
                <ColorInput
                  label="Fog color"
                  value={local.fogColor}
                  onChange={(v) => set('fogColor', v)}
                  size="xs"
                  radius="xs"
                  fixOnBlur
                />
                {local.fogType === 'linear' && (
                  <>
                    <NumberInputSlider
                      label="Fog near"
                      min={0}
                      max={500}
                      step={1}
                      value={local.fogNear}
                      onChange={(v) => set('fogNear', v)}
                    />
                    <NumberInputSlider
                      label="Fog far"
                      min={1}
                      max={2000}
                      step={1}
                      value={local.fogFar}
                      onChange={(v) => set('fogFar', v)}
                    />
                  </>
                )}
              </>
            )}
          </Stack>
        </Collapse>

        <Divider />

        {/* ── Post-Processing ── */}
        <SectionHeader label="Post-Processing" icon={<IconMoon size={12} />} open={ppOpen} onToggle={togglePP} />
        <Collapse expanded={ppOpen}>
          <Stack gap="xs" pb={4}>
            {/* Bloom */}
            <Stack gap={4}>
              <Switch
                label="Bloom"
                size="xs"
                checked={!!pp.bloom?.enabled}
                onChange={(e) =>
                  setPostProcess({ ...pp, bloom: { ...(pp.bloom ?? {}), enabled: e.currentTarget.checked } })
                }
              />
              <Collapse expanded={!!pp.bloom?.enabled}>
                <Stack gap="xs" pl={4}>
                  <NumberInputSlider
                    label="Strength"
                    min={0}
                    max={3}
                    step={0.05}
                    value={pp.bloom?.strength ?? 0.5}
                    onChange={(v) =>
                      setPostProcess({ ...pp, bloom: { ...(pp.bloom ?? {}), enabled: true, strength: v } })
                    }
                  />
                  <NumberInputSlider
                    label="Radius"
                    min={0}
                    max={1}
                    step={0.01}
                    value={pp.bloom?.radius ?? 0.4}
                    onChange={(v) =>
                      setPostProcess({ ...pp, bloom: { ...(pp.bloom ?? {}), enabled: true, radius: v } })
                    }
                  />
                  <NumberInputSlider
                    label="Threshold"
                    min={0}
                    max={1}
                    step={0.01}
                    value={pp.bloom?.threshold ?? 0.85}
                    onChange={(v) =>
                      setPostProcess({ ...pp, bloom: { ...(pp.bloom ?? {}), enabled: true, threshold: v } })
                    }
                  />
                </Stack>
              </Collapse>
            </Stack>

            {/* Vignette */}
            <Stack gap={4}>
              <Switch
                label="Vignette"
                size="xs"
                checked={!!pp.vignette?.enabled}
                onChange={(e) =>
                  setPostProcess({ ...pp, vignette: { ...(pp.vignette ?? {}), enabled: e.currentTarget.checked } })
                }
              />
              <Collapse expanded={!!pp.vignette?.enabled}>
                <Stack gap="xs" pl={4}>
                  <NumberInputSlider
                    label="Offset"
                    min={0}
                    max={1}
                    step={0.01}
                    value={pp.vignette?.offset ?? 0.5}
                    onChange={(v) =>
                      setPostProcess({ ...pp, vignette: { ...(pp.vignette ?? {}), enabled: true, offset: v } })
                    }
                  />
                  <NumberInputSlider
                    label="Darkness"
                    min={0}
                    max={3}
                    step={0.05}
                    value={pp.vignette?.darkness ?? 1.5}
                    onChange={(v) =>
                      setPostProcess({ ...pp, vignette: { ...(pp.vignette ?? {}), enabled: true, darkness: v } })
                    }
                  />
                </Stack>
              </Collapse>
            </Stack>

            {/* SSAO */}
            <Stack gap={4}>
              <Switch
                label="SSAO (Ambient Occlusion)"
                size="xs"
                checked={!!pp.ssao?.enabled}
                onChange={(e) =>
                  setPostProcess({ ...pp, ssao: { ...(pp.ssao ?? {}), enabled: e.currentTarget.checked } })
                }
              />
              <Collapse expanded={!!pp.ssao?.enabled}>
                <Stack gap="xs" pl={4}>
                  <NumberInputSlider
                    label="Kernel Radius"
                    min={1}
                    max={32}
                    step={0.5}
                    value={pp.ssao?.kernelRadius ?? 8}
                    onChange={(v) =>
                      setPostProcess({ ...pp, ssao: { ...(pp.ssao ?? {}), enabled: true, kernelRadius: v } })
                    }
                  />
                </Stack>
              </Collapse>
            </Stack>

            {/* Depth of Field */}
            <Stack gap={4}>
              <Switch
                label="Depth of Field"
                size="xs"
                checked={!!pp.dof?.enabled}
                onChange={(e) =>
                  setPostProcess({ ...pp, dof: { ...(pp.dof ?? {}), enabled: e.currentTarget.checked } })
                }
              />
              <Collapse expanded={!!pp.dof?.enabled}>
                <Stack gap="xs" pl={4}>
                  <NumberInputSlider
                    label="Focus"
                    min={0}
                    max={2000}
                    step={1}
                    value={pp.dof?.focus ?? 500}
                    onChange={(v) => setPostProcess({ ...pp, dof: { ...(pp.dof ?? {}), enabled: true, focus: v } })}
                  />
                  <NumberInputSlider
                    label="Aperture"
                    min={0}
                    max={0.0001}
                    step={0.000001}
                    value={pp.dof?.aperture ?? 0.000025}
                    onChange={(v) => setPostProcess({ ...pp, dof: { ...(pp.dof ?? {}), enabled: true, aperture: v } })}
                  />
                  <NumberInputSlider
                    label="Max Blur"
                    min={0}
                    max={0.1}
                    step={0.001}
                    value={pp.dof?.maxblur ?? 0.01}
                    onChange={(v) => setPostProcess({ ...pp, dof: { ...(pp.dof ?? {}), enabled: true, maxblur: v } })}
                  />
                </Stack>
              </Collapse>
            </Stack>

            {/* Color Correction */}
            <Stack gap={4}>
              <Switch
                label="Color Correction"
                size="xs"
                checked={!!pp.colorCorrection?.enabled}
                onChange={(e) =>
                  setPostProcess({
                    ...pp,
                    colorCorrection: { ...(pp.colorCorrection ?? {}), enabled: e.currentTarget.checked },
                  })
                }
              />
              <Collapse expanded={!!pp.colorCorrection?.enabled}>
                <Stack gap="xs" pl={4}>
                  <NumberInputSlider
                    label="Gamma"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={pp.colorCorrection?.powRGB?.[0] ?? 1}
                    onChange={(v) =>
                      setPostProcess({
                        ...pp,
                        colorCorrection: {
                          ...(pp.colorCorrection ?? {}),
                          enabled: true,
                          powRGB: [v, v, v],
                        },
                      })
                    }
                  />
                  <NumberInputSlider
                    label="Contrast"
                    min={0}
                    max={3}
                    step={0.05}
                    value={pp.colorCorrection?.mulRGB?.[0] ?? 1}
                    onChange={(v) =>
                      setPostProcess({
                        ...pp,
                        colorCorrection: {
                          ...(pp.colorCorrection ?? {}),
                          enabled: true,
                          mulRGB: [v, v, v],
                        },
                      })
                    }
                  />
                  <NumberInputSlider
                    label="Brightness"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={pp.colorCorrection?.addRGB?.[0] ?? 0}
                    onChange={(v) =>
                      setPostProcess({
                        ...pp,
                        colorCorrection: {
                          ...(pp.colorCorrection ?? {}),
                          enabled: true,
                          addRGB: [v, v, v],
                        },
                      })
                    }
                  />
                </Stack>
              </Collapse>
            </Stack>
          </Stack>
        </Collapse>

        <Divider />

        {/* ── Renderer ── */}
        <SectionHeader label="Renderer" icon={<IconPhoto size={12} />} open={rendererOpen} onToggle={toggleRenderer} />
        <Collapse expanded={rendererOpen}>
          <Stack gap="xs" pb={4}>
            <Select
              label="Color space"
              size="xs"
              radius="xs"
              data={COLOR_SPACE_OPTIONS}
              value={(rendererConfig.outputColorSpace as string) ?? SRGBColorSpace}
              onChange={(v) => {
                const next = { ...rendererConfig, outputColorSpace: v };
                set('rendererConfig', next);
                if (viewer) viewer.renderer.setSettings(next as RendererSettings);
              }}
            />
            <Select
              label="Tone mapping"
              size="xs"
              radius="xs"
              data={TONE_MAPPING_OPTIONS}
              value={rendererConfig.toneMapping?.toString() ?? ReinhardToneMapping.toString()}
              onChange={(v) => {
                const next = { ...rendererConfig, toneMapping: v ? +v : undefined };
                set('rendererConfig', next);
                if (viewer) viewer.renderer.setSettings(next as RendererSettings);
              }}
            />
            <NumberInputSlider
              label="Tone mapping exposure"
              min={0}
              max={10}
              step={0.1}
              value={(rendererConfig.toneMappingExposure as number) ?? 1}
              onChange={(v) => {
                const next = { ...rendererConfig, toneMappingExposure: v };
                set('rendererConfig', next);
                if (viewer) viewer.renderer.setSettings(next as RendererSettings);
              }}
            />
            <Select
              label="Shadow map"
              size="xs"
              radius="xs"
              data={SHADOW_MAP_OPTIONS}
              value={rendererConfig.shadowMapType?.toString() ?? ''}
              onChange={(v) => {
                const next = { ...rendererConfig, shadowMapType: v ? +v : undefined };
                set('rendererConfig', next);
                if (viewer) viewer.renderer.setSettings(next as RendererSettings);
              }}
            />
            <ColorInput
              label="Clear color"
              value={(rendererConfig.clearColor as string) ?? '#000000'}
              onChange={(v) => {
                const next = { ...rendererConfig, clearColor: v };
                set('rendererConfig', next);
                if (viewer) viewer.renderer.setSettings(next as RendererSettings);
              }}
              eyeDropperIcon={<IconFocus2 style={{ width: rem(14), height: rem(14) }} />}
              size="xs"
              radius="xs"
              fixOnBlur
            />
            <NumberInputSlider
              label="Clear alpha"
              min={0}
              max={1}
              step={0.01}
              value={(rendererConfig.clearAlpha as number) ?? 0}
              onChange={(v) => {
                const next = { ...rendererConfig, clearAlpha: v };
                set('rendererConfig', next);
                if (viewer) viewer.renderer.setSettings(next as RendererSettings);
              }}
            />
          </Stack>
        </Collapse>

        <Divider />

        {isDirty && (
          <Badge size="xs" variant="dot" color="yellow" mx="auto">
            Unsaved changes
          </Badge>
        )}
        <Button size="xs" fullWidth onClick={handleSave} loading={isSaving} disabled={!modelId || !isDirty}>
          Save display config
        </Button>
      </Stack>
    </ScrollArea>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  label: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  badge?: string;
}

function SectionHeader({ label, icon, open, onToggle, badge }: SectionHeaderProps) {
  return (
    <Group justify="space-between" gap="xs" onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none' }} py={2}>
      <Group gap={6}>
        {icon}
        <Text size="xs" fw={600}>
          {label}
        </Text>
        {badge && (
          <Badge size="xs" variant="filled">
            {badge}
          </Badge>
        )}
      </Group>
      <Text size="xs" c="dimmed">
        {open ? '▲' : '▼'}
      </Text>
    </Group>
  );
}
