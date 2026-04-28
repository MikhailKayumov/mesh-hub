import { ActionIcon, FileButton, Group, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { useDeleteModelAudioMutation, useListModelAudioQuery, useUploadModelAudioMutation } from '@/app/api/audio.ts';
import { EmptyData } from '@/widgets/EmptyData';

interface AudioTabProps {
    modelId?: string;
}

export function AudioTab({ modelId }: AudioTabProps) {
    const { data: tracks = [], isLoading } = useListModelAudioQuery(
        { modelId: modelId! },
        { skip: !modelId },
    );
    const [uploadAudio, { isLoading: isUploading }] = useUploadModelAudioMutation();
    const [deleteAudio] = useDeleteModelAudioMutation();

    const handleUpload = async (file: File | null) => {
        if (!file || !modelId) return;
        try {
            await uploadAudio({ modelId, file }).unwrap();
            notifications.show({ message: 'Audio uploaded', color: 'green' });
        } catch {
            notifications.show({ message: 'Failed to upload audio', color: 'red' });
        }
    };

    const handleDelete = async (audioId: string) => {
        if (!modelId) return;
        try {
            await deleteAudio({ modelId, audioId }).unwrap();
        } catch {
            notifications.show({ message: 'Failed to delete audio track', color: 'red' });
        }
    };

    if (!modelId) return null;

    return (
        <Stack gap="sm" p="sm" h="100%">
            <Group justify="space-between" align="center">
                <Title order={6}>Audio Tracks</Title>
                <FileButton onChange={handleUpload} accept="audio/*">
                    {(props) => (
                        <ActionIcon {...props} loading={isUploading} variant="subtle" size="sm">
                            <IconUpload size={14} />
                        </ActionIcon>
                    )}
                </FileButton>
            </Group>
            <ScrollArea flex={1}>
                {!isLoading && tracks.length === 0 && (
                    <EmptyData label="No audio tracks" />
                )}
                <Stack gap="xs">
                    {tracks.map((track) => (
                        <Group key={track.id} justify="space-between" wrap="nowrap">
                            <Text size="xs" truncate="end" flex={1}>
                                {track.originalName}
                            </Text>
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={() => handleDelete(track.id)}
                            >
                                <IconTrash size={12} />
                            </ActionIcon>
                        </Group>
                    ))}
                </Stack>
            </ScrollArea>
        </Stack>
    );
}
