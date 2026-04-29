import { ActionIcon, FileButton, Group, ScrollArea, Stack, Text, Title, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlayerPlay, IconPlayerStop, IconTrash, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { useDeleteModelAudioMutation, useListModelAudioQuery, useUploadModelAudioMutation } from '@/app/api/audio.ts';
import { EmptyData } from '@/widgets/EmptyData';
import type { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';

interface AudioTabProps {
  viewer: Viewer | null;
  modelId?: string;
}

export function AudioTab({ viewer, modelId }: AudioTabProps) {
  const { data: tracks = [], isLoading } = useListModelAudioQuery({ modelId: modelId! }, { skip: !modelId });
  const [uploadAudio, { isLoading: isUploading }] = useUploadModelAudioMutation();
  const [deleteAudio] = useDeleteModelAudioMutation();
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const handleUpload = async (file: File | null) => {
    if (!file || !modelId) return;
    try {
      await uploadAudio({ modelId, file }).unwrap();
      notifications.show({ message: 'Audio uploaded', color: 'green' });
    } catch {
      notifications.show({ message: 'Failed to upload audio', color: 'red' });
    }
  };

  const handleDelete = (audioId: string, name: string) => {
    if (!modelId) return;
    modals.openConfirmModal({
      title: 'Удалить аудио?',
      children: <Text size="sm">Файл «{name}» будет удалён без возможности восстановления.</Text>,
      labels: { confirm: 'Удалить', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          if (previewingId === audioId) {
            viewer?.stopAllAudio();
            setPreviewingId(null);
          }
          await deleteAudio({ modelId, audioId }).unwrap();
        } catch {
          notifications.show({ message: 'Failed to delete audio track', color: 'red' });
        }
      },
    });
  };

  const handlePreviewToggle = (audioId: string) => {
    if (!viewer || !modelId) return;
    if (previewingId === audioId) {
      viewer.stopAllAudio();
      setPreviewingId(null);
      return;
    }
    viewer.stopAllAudio();
    viewer.playAudio(`/api/models-3d/${modelId}/audio/${audioId}/stream`, { volume: 1, loop: false });
    setPreviewingId(audioId);
  };

  if (!modelId) return null;

  return (
    <Stack gap="sm" p="sm" h="100%">
      <Group justify="space-between" align="center">
        <Title order={6}>Audio Tracks</Title>
        <Tooltip label="Upload (MP3 / OGG / WAV, ≤20 MB)">
          <FileButton onChange={handleUpload} accept="audio/mpeg,audio/ogg,audio/wav">
            {(props) => (
              <ActionIcon {...props} loading={isUploading} variant="subtle" size="sm">
                <IconUpload size={14} />
              </ActionIcon>
            )}
          </FileButton>
        </Tooltip>
      </Group>
      <ScrollArea flex={1}>
        {!isLoading && tracks.length === 0 && <EmptyData label="No audio tracks" />}
        <Stack gap="xs">
          {tracks.map((track) => {
            const isPreviewing = previewingId === track.id;
            return (
              <Group key={track.id} justify="space-between" wrap="nowrap" gap={4}>
                <Text size="xs" truncate="end" flex={1}>
                  {track.originalName}
                </Text>
                <Tooltip label={isPreviewing ? 'Stop preview' : 'Preview'}>
                  <ActionIcon size="xs" variant="subtle" onClick={() => handlePreviewToggle(track.id)}>
                    {isPreviewing ? <IconPlayerStop size={12} /> : <IconPlayerPlay size={12} />}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => handleDelete(track.id, track.originalName)}
                  >
                    <IconTrash size={12} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            );
          })}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
