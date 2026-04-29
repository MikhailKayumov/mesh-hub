import { Center, Flex, Group, Loader, Overlay, Pagination, Stack, Text, Title, Transition } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { ACCEPTED_3D_MODEL_FILE_TYPES } from '@/shared/constants/files.ts';
import { useDocumentTitle } from '@/shared/hooks';
import { Models3DList } from '@/widgets/Models3DList';
import { Upload3DModelModal } from '../../widgets/Upload3DModelModal';
import { useModels3D } from './useModels3D.ts';

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_3D_MODEL_FILE_TYPES.some((ext) => lower.endsWith(ext));
}

export function ModelsPage() {
  useDocumentTitle('Модели');

  const { models, isModelsLoading, page, setPage, totalPages } = useModels3D();
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    let counter = 0;

    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
      counter += 1;
      setIsDragging(counter > 0);
    };

    const onDragLeave = () => {
      counter = Math.max(0, counter - 1);
      setIsDragging(counter > 0);
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      counter = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const accepted = Array.from(files).find(isAcceptedFile);
      if (!accepted) return;

      // Re-create reference identity so consecutive drops of the same file re-trigger the hook effect.
      setDroppedFile(accepted);
    };

    document.body.addEventListener('dragenter', onDragEnter);
    document.body.addEventListener('dragleave', onDragLeave);
    document.body.addEventListener('dragover', onDragOver);
    document.body.addEventListener('drop', onDrop);

    return () => {
      document.body.removeEventListener('dragenter', onDragEnter);
      document.body.removeEventListener('dragleave', onDragLeave);
      document.body.removeEventListener('dragover', onDragOver);
      document.body.removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <>
      <Group mb="lg" justify="space-between">
        <Title>Модели</Title>
        <Upload3DModelModal initialFile={droppedFile} />
      </Group>
      {isModelsLoading ? (
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Loader />
        </Flex>
      ) : (
        <Stack gap={24} style={{ flex: 1 }}>
          <Models3DList
            models={models}
            emptyLabel="Ваш список 3D моделей пуст"
            mode="user"
            span={{ xs: 12, sm: 12, md: 6, lg: 4 }}
          />
          {totalPages > 1 && (
            <Center>
              <Pagination withEdges total={totalPages} value={page} onChange={setPage} size="sm" radius="sm" />
            </Center>
          )}
        </Stack>
      )}
      <Transition mounted={isDragging} transition="fade" duration={150}>
        {(styles) => (
          <Overlay
            color="#000"
            backgroundOpacity={0.55}
            blur={3}
            zIndex={1000}
            style={{ ...styles, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Stack align="center" gap={12}>
              <IconUpload size={64} color="white" stroke={1.5} />
              <Text c="white" size="lg" fw={500}>
                Перетащите файл для загрузки
              </Text>
            </Stack>
          </Overlay>
        )}
      </Transition>
    </>
  );
}
