import { Center, Flex, Group, Loader, Pagination, Stack, Title } from '@mantine/core';
import { useDocumentTitle } from '@/shared/hooks';
import { Models3DList } from '@/widgets/Models3DList';
import { Upload3DModelModal } from '../../widgets/Upload3DModelModal';
import { useModels3D } from './useModels3D.ts';

export function ModelsPage() {
  useDocumentTitle('Модели');

  const { models, isModelsLoading, page, setPage, totalPages } = useModels3D();

  return (
    <>
      <Group mb="lg" justify="space-between">
        <Title>Модели</Title>
        <Upload3DModelModal />
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
    </>
  );
}
