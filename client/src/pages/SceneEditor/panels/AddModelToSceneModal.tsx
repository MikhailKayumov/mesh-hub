import { Badge, Box, Image, Modal, SimpleGrid, Skeleton, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import type { Model3DResponseDto, SceneResponseDto } from '@/app/api/dto.ts';
import { useCurrentUser3DModelsQuery, useModels3DQuery } from '@/app/api/models-3d.ts';
import { useAddSceneObjectMutation } from '@/app/api/scenes.ts';
import { getThumbnailSrc } from '@/shared/utils/model3d.ts';
import { EmptyData } from '@/widgets/EmptyData';

interface Props {
  opened: boolean;
  onClose: () => void;
  scene: SceneResponseDto;
}

function ModelCard({ model, onAdd }: { model: Model3DResponseDto; onAdd: (modelId: string) => void }) {
  const thumbSrc = getThumbnailSrc(model.id, model.thumbnail);

  return (
    <Box
      style={(theme) => ({
        border: `1px solid ${theme.colors.dark[4]}`,
        borderRadius: theme.radius.sm,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': { borderColor: theme.colors.primary[7] },
      })}
      onClick={() => onAdd(model.id)}
    >
      <Box style={{ aspectRatio: '4/3', background: '#1a1a1a', position: 'relative' }}>
        {thumbSrc ? (
          <Image src={thumbSrc} alt={model.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size="xs" c="dimmed">
              No preview
            </Text>
          </Box>
        )}
      </Box>
      <Box p="xs">
        <Text size="xs" fw={500} lineClamp={1}>
          {model.name}
        </Text>
        <Badge size="xs" variant="light" mt={2}>
          {model.file.extension.toUpperCase()}
        </Badge>
      </Box>
    </Box>
  );
}

function SkeletonGrid() {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
      {Array.from({ length: 6 }).map((_, i) => (
        <Stack key={i} gap={4}>
          <Skeleton style={{ aspectRatio: '4/3' }} />
          <Skeleton height={14} width="70%" />
          <Skeleton height={16} width={40} />
        </Stack>
      ))}
    </SimpleGrid>
  );
}

export function AddModelToSceneModal({ opened, onClose, scene }: Props) {
  const [search, setSearch] = useState('');
  const [addObject, { isLoading: isAdding }] = useAddSceneObjectMutation();

  const { data: userModels, isLoading: isLoadingUser } = useCurrentUser3DModelsQuery({ size: 100 }, { skip: !opened });

  const { data: workspaceModels, isLoading: isLoadingWorkspace } = useModels3DQuery(
    { size: 100, workspaceId: scene.workspaceId ?? undefined },
    { skip: !opened || !scene.workspaceId },
  );

  const isLoading = isLoadingUser || isLoadingWorkspace;

  const allModels = useMemo(() => {
    const seen = new Set<string>();
    const combined: Model3DResponseDto[] = [];
    for (const m of [...(userModels?.data ?? []), ...(workspaceModels?.data ?? [])]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        combined.push(m);
      }
    }
    return combined;
  }, [userModels, workspaceModels]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allModels;
    const q = search.toLowerCase();
    return allModels.filter((m) => m.name.toLowerCase().includes(q));
  }, [allModels, search]);

  const handleAdd = async (modelId: string) => {
    try {
      await addObject({ sceneId: scene.id, body: { modelId } }).unwrap();
      onClose();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err?.data?.message ?? 'Failed to add model to scene',
      });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add model to scene" size="lg">
      <Stack gap="md">
        <TextInput
          placeholder="Search models..."
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

        {isLoading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <Stack align="center" py="xl">
            <EmptyData label={allModels.length === 0 ? 'Upload a model first' : 'No models match your search'} />
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs" style={{ opacity: isAdding ? 0.6 : 1 }}>
            {filtered.map((model) => (
              <ModelCard key={model.id} model={model} onAdd={handleAdd} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Modal>
  );
}
