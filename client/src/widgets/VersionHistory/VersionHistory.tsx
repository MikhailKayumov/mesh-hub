import { useState } from 'react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    FileInput,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    Textarea,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { IconCheck, IconCloudUpload, IconEye, IconTrash } from '@tabler/icons-react';
import {
    useActivateVersionMutation,
    useDeleteVersionMutation,
    useModelVersionsQuery,
    useUploadVersionMutation,
} from '@/app/api/versions.ts';
import type { ModelVersionResponseDto } from '@/app/api/dto.ts';
import { getModel3DVersionFileSrc } from '@/shared/utils/model3d.ts';
import type { Viewer } from '../Model3DViewer/classes/Viewer';

export interface VersionHistoryProps {
    modelId: string;
    canEdit: boolean;
    viewer?: Viewer | null;
}

interface UploadFormValues {
    file: File | null;
    changeNotes: string;
}

function UploadVersionModal({
    modelId,
    opened,
    onClose,
}: {
    modelId: string;
    opened: boolean;
    onClose: () => void;
}) {
    const [uploadVersion, { isLoading }] = useUploadVersionMutation();
    const form = useForm<UploadFormValues>({
        initialValues: { file: null, changeNotes: '' },
        validate: {
            file: (v) => (!v ? 'Выберите файл' : null),
        },
    });

    const handleSubmit = async (values: UploadFormValues) => {
        if (!values.file) return;
        const formData = new FormData();
        formData.append('file', values.file);
        if (values.changeNotes) formData.append('changeNotes', values.changeNotes);
        await uploadVersion({ modelId, formData });
        form.reset();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Загрузить новую версию" size="md">
            <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap={12}>
                    <FileInput
                        {...form.getInputProps('file')}
                        label="Файл модели"
                        placeholder="Выберите .glb, .gltf или .zip"
                        accept=".glb,.gltf,.zip"
                        required
                    />
                    <Textarea
                        {...form.getInputProps('changeNotes')}
                        label="Описание изменений"
                        placeholder="Что изменилось в этой версии?"
                        autosize
                        minRows={2}
                        maxRows={5}
                        maxLength={500}
                    />
                    <Group justify="flex-end" mt={4}>
                        <Button variant="default" onClick={onClose} disabled={isLoading}>
                            Отмена
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Загрузить
                        </Button>
                    </Group>
                </Stack>
            </Box>
        </Modal>
    );
}

function VersionCard({
    version,
    modelId,
    canEdit,
    viewer,
}: {
    version: ModelVersionResponseDto;
    modelId: string;
    canEdit: boolean;
    viewer?: Viewer | null;
}) {
    const [activateVersion, { isLoading: activating }] = useActivateVersionMutation();
    const [deleteVersion, { isLoading: deleting }] = useDeleteVersionMutation();
    const [confirmDelete, { open: openDelete, close: closeDelete }] = useDisclosure(false);

    const fileUrl = getModel3DVersionFileSrc(modelId, version.id, version.entryFile ?? version.fileName);

    const handlePreview = () => {
        if (viewer) {
            viewer.loadFile(fileUrl);
        }
    };

    const handleActivate = async () => {
        await activateVersion({ modelId, versionId: version.id });
    };

    const handleDelete = async () => {
        await deleteVersion({ modelId, versionId: version.id });
        closeDelete();
    };

    const uploaderName = [version.uploader.firstName, version.uploader.lastName].filter(Boolean).join(' ') || 'Пользователь';

    return (
        <>
            <Box
                p={12}
                style={{
                    borderRadius: 8,
                    border: '1px solid var(--mantine-color-default-border)',
                    background: version.isActive ? 'var(--mantine-color-green-light)' : undefined,
                }}
            >
                <Group justify="space-between" wrap="nowrap" gap={8}>
                    <Stack gap={2} style={{ minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap">
                            <Text fw={600} size="sm">
                                v{version.versionNumber}
                            </Text>
                            {version.isActive && (
                                <Badge color="green" size="xs">
                                    Активная
                                </Badge>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed" truncate>
                            {version.fileName}
                        </Text>
                        {version.changeNotes && (
                            <Text size="xs" c="dimmed" lineClamp={2}>
                                {version.changeNotes}
                            </Text>
                        )}
                        <Text size="xs" c="dimmed">
                            {uploaderName} · {new Date(version.createdAt).toLocaleDateString('ru-RU')}
                        </Text>
                    </Stack>
                    <Group gap={4} wrap="nowrap">
                        {viewer && (
                            <Tooltip label="Предпросмотр">
                                <ActionIcon variant="subtle" onClick={handlePreview} size="sm">
                                    <IconEye size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {canEdit && !version.isActive && (
                            <>
                                <Tooltip label="Сделать активной">
                                    <ActionIcon
                                        variant="subtle"
                                        color="green"
                                        onClick={handleActivate}
                                        loading={activating}
                                        size="sm"
                                    >
                                        <IconCheck size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Удалить версию">
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={openDelete}
                                        loading={deleting}
                                        size="sm"
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </>
                        )}
                    </Group>
                </Group>
            </Box>

            <Modal opened={confirmDelete} onClose={closeDelete} title="Удалить версию?" size="sm">
                <Text size="sm" mb={16}>
                    Файлы версии <strong>v{version.versionNumber}</strong> будут безвозвратно удалены.
                </Text>
                <Group justify="flex-end" gap={8}>
                    <Button variant="default" onClick={closeDelete} disabled={deleting}>
                        Отмена
                    </Button>
                    <Button color="red" onClick={handleDelete} loading={deleting}>
                        Удалить
                    </Button>
                </Group>
            </Modal>
        </>
    );
}

export function VersionHistory({ modelId, canEdit, viewer }: VersionHistoryProps) {
    const { data: versions, isLoading, isError } = useModelVersionsQuery({ modelId });
    const [uploadOpened, { open: openUpload, close: closeUpload }] = useDisclosure(false);

    if (isLoading) {
        return (
            <Group justify="center" py={32}>
                <Loader size="sm" />
            </Group>
        );
    }

    if (isError) {
        return (
            <Text c="red" size="sm" ta="center" py={16}>
                Не удалось загрузить версии
            </Text>
        );
    }

    return (
        <Stack gap={12}>
            {canEdit && (
                <Button
                    leftSection={<IconCloudUpload size={16} />}
                    variant="light"
                    onClick={openUpload}
                    fullWidth
                >
                    Загрузить новую версию
                </Button>
            )}

            {!versions?.length ? (
                <Text c="dimmed" size="sm" ta="center" py={16}>
                    Версий пока нет
                </Text>
            ) : (
                versions.map((v) => (
                    <VersionCard key={v.id} version={v} modelId={modelId} canEdit={canEdit} viewer={viewer} />
                ))
            )}

            {canEdit && (
                <UploadVersionModal modelId={modelId} opened={uploadOpened} onClose={closeUpload} />
            )}
        </Stack>
    );
}
