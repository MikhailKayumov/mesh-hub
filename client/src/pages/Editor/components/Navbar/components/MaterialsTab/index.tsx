import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Collapse,
    ColorInput,
    FileButton,
    Group,
    Image,
    LoadingOverlay,
    NavLink,
    ScrollArea,
    Stack,
    Switch,
    Text,
    Title,
    Tooltip,
    rem,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconFocus2, IconUpload, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Mesh } from 'three';
import type { MaterialOverrideResponseDto, MaterialOverrideUpsertDto } from '@/app/api/dto.ts';
import {
    useDeleteMaterialMutation,
    useDeleteMaterialTextureMutation,
    useGetMaterialsQuery,
    useUploadMaterialTextureMutation,
    useUpsertMaterialMutation,
} from '@/app/api/materials.ts';
import { NumberInputSlider } from '@/widgets/NumberInputSlider';
import type { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import { WorldEventNames } from '@/widgets/Model3DViewer/classes/World/constants.ts';

const TEXTURE_SLOTS = [
    { key: 'map', label: 'Base Texture', urlKey: 'textureMapUrl' },
    { key: 'normal', label: 'Normal Map', urlKey: 'normalMapUrl' },
    { key: 'roughness', label: 'Roughness Map', urlKey: 'roughnessMapUrl' },
    { key: 'metalness', label: 'Metalness Map', urlKey: 'metalnessMapUrl' },
    { key: 'emissive', label: 'Emissive Map', urlKey: 'emissiveMapUrl' },
    { key: 'ao', label: 'AO Map', urlKey: 'aoMapUrl' },
] as const;

type TextureUrlKey = (typeof TEXTURE_SLOTS)[number]['urlKey'];

function formFromDto(dto: MaterialOverrideResponseDto): MaterialOverrideUpsertDto {
    return {
        colorHex: dto.colorHex,
        metalness: dto.metalness,
        roughness: dto.roughness,
        emissiveHex: dto.emissiveHex,
        emissiveIntensity: dto.emissiveIntensity,
        opacity: dto.opacity,
        wireframe: dto.wireframe,
    };
}

interface MaterialsTabProps {
    viewer: Viewer;
    modelId?: string;
}

export function MaterialsTab({ viewer, modelId }: MaterialsTabProps) {
    const [meshNames, setMeshNames] = useState<string[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [forms, setForms] = useState<Record<string, MaterialOverrideUpsertDto>>({});

    const { data: materials = [], isFetching } = useGetMaterialsQuery(
        { modelId: modelId! },
        { skip: !modelId },
    );

    const [upsertMaterial, { isLoading: isUpserting }] = useUpsertMaterialMutation();
    const [deleteMaterial, { isLoading: isDeleting }] = useDeleteMaterialMutation();
    const [uploadTexture, { isLoading: isUploadingTexture }] = useUploadMaterialTextureMutation();
    const [deleteTexture, { isLoading: isDeletingTexture }] = useDeleteMaterialTextureMutation();

    const isMutating = isUpserting || isDeleting || isUploadingTexture || isDeletingTexture;

    const collectMeshNames = () => {
        const names: string[] = [];
        viewer.world.scene.traverse((obj) => {
            if (obj instanceof Mesh && obj.name) {
                names.push(obj.name);
            }
        });
        setMeshNames([...new Set(names)]);
    };

    useEffect(() => {
        collectMeshNames();
        const cleanup = viewer.world.on(WorldEventNames.WorldSceneChange, () => collectMeshNames());
        return cleanup;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewer]);

    // Seed form state from fetched overrides (only for meshes not yet edited locally)
    useEffect(() => {
        if (!materials.length) return;
        setForms((prev) => {
            const next = { ...prev };
            for (const mat of materials) {
                if (!next[mat.meshName]) {
                    next[mat.meshName] = formFromDto(mat);
                }
            }
            return next;
        });
    }, [materials]);

    const getForm = (meshName: string): MaterialOverrideUpsertDto => forms[meshName] ?? {};

    const setFormField = (
        meshName: string,
        key: keyof MaterialOverrideUpsertDto,
        value: MaterialOverrideUpsertDto[typeof key],
    ) => {
        setForms((prev) => ({
            ...prev,
            [meshName]: { ...prev[meshName], [key]: value },
        }));
    };

    const toggleExpanded = (meshName: string) =>
        setExpanded((prev) => ({ ...prev, [meshName]: !prev[meshName] }));

    const getOverride = (meshName: string): MaterialOverrideResponseDto | undefined =>
        materials.find((m) => m.meshName === meshName);

    const handleSave = async (meshName: string) => {
        if (!modelId) return;
        const dto = forms[meshName] ?? {};
        try {
            const result = await upsertMaterial({ modelId, meshName, dto }).unwrap();
            const updatedOverrides = materials.filter((m) => m.meshName !== meshName).concat(result);
            viewer.world.applyMaterialOverrides(updatedOverrides);
        } catch (err: any) {
            notifications.show({
                color: 'red',
                title: 'Error',
                message: err?.data?.message ?? 'Failed to save material',
            });
        }
    };

    const handleReset = (meshName: string) => {
        if (!modelId) return;
        modals.openConfirmModal({
            title: 'Reset material',
            children: (
                <Text size="sm">
                    Remove all overrides for <b>{meshName}</b>? This cannot be undone.
                </Text>
            ),
            labels: { confirm: 'Reset', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await deleteMaterial({ modelId: modelId!, meshName }).unwrap();
                    setForms((prev) => {
                        const next = { ...prev };
                        delete next[meshName];
                        return next;
                    });
                    const remaining = materials.filter((m) => m.meshName !== meshName);
                    viewer.world.applyMaterialOverrides(remaining);
                } catch (err: any) {
                    notifications.show({
                        color: 'red',
                        title: 'Error',
                        message: err?.data?.message ?? 'Failed to reset material',
                    });
                }
            },
        });
    };

    const handleTextureUpload = async (meshName: string, type: string, file: File | null) => {
        if (!file || !modelId) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const result = await uploadTexture({ modelId, meshName, type, formData }).unwrap();
            const updatedOverrides = materials.filter((m) => m.meshName !== meshName).concat(result);
            viewer.world.applyMaterialOverrides(updatedOverrides);
        } catch (err: any) {
            notifications.show({
                color: 'red',
                title: 'Error',
                message: err?.data?.message ?? 'Failed to upload texture',
            });
        }
    };

    const handleTextureDelete = async (meshName: string, type: string) => {
        if (!modelId) return;
        try {
            const result = await deleteTexture({ modelId, meshName, type }).unwrap();
            const updatedOverrides = materials.filter((m) => m.meshName !== meshName).concat(result);
            viewer.world.applyMaterialOverrides(updatedOverrides);
        } catch (err: any) {
            notifications.show({
                color: 'red',
                title: 'Error',
                message: err?.data?.message ?? 'Failed to delete texture',
            });
        }
    };

    return (
        <Stack gap="xs" h="100%" style={{ position: 'relative' }}>
            <LoadingOverlay visible={isMutating || isFetching} zIndex={500} overlayProps={{ blur: 1 }} />

            <Group px={4} pt={4}>
                <Title order={5}>Materials ({meshNames.length})</Title>
            </Group>

            <ScrollArea flex={1} px={4}>
                <Stack gap={4}>
                    {meshNames.length === 0 ? (
                        <Text size="xs" c="dimmed" ta="center" py="md">
                            No meshes found in scene
                        </Text>
                    ) : (
                        meshNames.map((meshName) => {
                            const override = getOverride(meshName);
                            const form = getForm(meshName);
                            const isOpen = !!expanded[meshName];

                            return (
                                <Stack key={meshName} gap={0}>
                                    <NavLink
                                        label={
                                            <Text size="xs" truncate>
                                                {meshName}
                                            </Text>
                                        }
                                        active={isOpen}
                                        leftSection={
                                            override?.colorHex ? (
                                                <Box
                                                    w={14}
                                                    h={14}
                                                    style={{
                                                        background: override.colorHex,
                                                        borderRadius: 2,
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            ) : undefined
                                        }
                                        rightSection={
                                            override ? (
                                                <Badge variant="dot" color="yellow" size="xs">
                                                    override
                                                </Badge>
                                            ) : undefined
                                        }
                                        onClick={() => toggleExpanded(meshName)}
                                        py={6}
                                        px={8}
                                        style={{ borderRadius: 4 }}
                                    />

                                    <Collapse in={isOpen}>
                                        <Stack
                                            gap="xs"
                                            p="xs"
                                            style={{
                                                borderLeft: '2px solid var(--mantine-color-default-border)',
                                                marginLeft: 4,
                                            }}
                                        >
                                            {/* ── Color & PBR fields ── */}
                                            <ColorInput
                                                label="Base Color"
                                                size="xs"
                                                value={form.colorHex || ''}
                                                onChange={(v) => setFormField(meshName, 'colorHex', v || undefined)}
                                                eyeDropperIcon={
                                                    <IconFocus2 style={{ width: rem(14), height: rem(14) }} />
                                                }
                                                format="hex"
                                                fixOnBlur
                                            />
                                            <NumberInputSlider
                                                label="Metalness"
                                                value={form.metalness ?? 0}
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                allowNegative={false}
                                                onChange={(v) => setFormField(meshName, 'metalness', v)}
                                            />
                                            <NumberInputSlider
                                                label="Roughness"
                                                value={form.roughness ?? 0}
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                allowNegative={false}
                                                onChange={(v) => setFormField(meshName, 'roughness', v)}
                                            />
                                            <ColorInput
                                                label="Emissive"
                                                size="xs"
                                                value={form.emissiveHex || ''}
                                                onChange={(v) =>
                                                    setFormField(meshName, 'emissiveHex', v || undefined)
                                                }
                                                eyeDropperIcon={
                                                    <IconFocus2 style={{ width: rem(14), height: rem(14) }} />
                                                }
                                                format="hex"
                                                fixOnBlur
                                            />
                                            <NumberInputSlider
                                                label="Emissive Intensity"
                                                value={form.emissiveIntensity ?? 0}
                                                min={0}
                                                max={10}
                                                step={0.01}
                                                allowNegative={false}
                                                onChange={(v) => setFormField(meshName, 'emissiveIntensity', v)}
                                            />
                                            <NumberInputSlider
                                                label="Opacity"
                                                value={form.opacity ?? 1}
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                allowNegative={false}
                                                onChange={(v) => setFormField(meshName, 'opacity', v)}
                                            />
                                            <Switch
                                                label="Wireframe"
                                                size="xs"
                                                checked={form.wireframe ?? false}
                                                onChange={(e) =>
                                                    setFormField(meshName, 'wireframe', e.target.checked)
                                                }
                                            />

                                            {/* ── Texture slots ── */}
                                            <Text size="xs" fw={500} mt={4}>
                                                Textures
                                            </Text>
                                            {TEXTURE_SLOTS.map(({ key, label, urlKey }) => {
                                                const url = override?.[urlKey as TextureUrlKey];
                                                return (
                                                    <Group
                                                        key={key}
                                                        justify="space-between"
                                                        wrap="nowrap"
                                                        gap="xs"
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                            style={{ flexShrink: 0, minWidth: 90 }}
                                                        >
                                                            {label}
                                                        </Text>
                                                        <Group gap={4} wrap="nowrap">
                                                            {url && (
                                                                <Image
                                                                    src={url}
                                                                    w={24}
                                                                    h={24}
                                                                    fit="contain"
                                                                    radius="xs"
                                                                />
                                                            )}
                                                            {url && (
                                                                <Tooltip label="Remove texture">
                                                                    <ActionIcon
                                                                        size="xs"
                                                                        variant="subtle"
                                                                        color="red"
                                                                        onClick={() =>
                                                                            handleTextureDelete(meshName, key)
                                                                        }
                                                                    >
                                                                        <IconX size={10} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                            )}
                                                            <FileButton
                                                                onChange={(file) =>
                                                                    handleTextureUpload(meshName, key, file)
                                                                }
                                                                accept="image/*"
                                                            >
                                                                {(props) => (
                                                                    <Tooltip label="Upload texture">
                                                                        <ActionIcon
                                                                            size="xs"
                                                                            variant="subtle"
                                                                            {...props}
                                                                        >
                                                                            <IconUpload size={10} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                )}
                                                            </FileButton>
                                                        </Group>
                                                    </Group>
                                                );
                                            })}

                                            {/* ── Actions ── */}
                                            <Group gap="xs" justify="flex-end" mt={4}>
                                                {override && (
                                                    <Button
                                                        size="xs"
                                                        variant="subtle"
                                                        color="red"
                                                        onClick={() => handleReset(meshName)}
                                                    >
                                                        Reset
                                                    </Button>
                                                )}
                                                <Button size="xs" onClick={() => handleSave(meshName)}>
                                                    Save
                                                </Button>
                                            </Group>
                                        </Stack>
                                    </Collapse>
                                </Stack>
                            );
                        })
                    )}
                </Stack>
            </ScrollArea>
        </Stack>
    );
}
