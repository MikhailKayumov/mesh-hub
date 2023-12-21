import { Center, Flex, Group, Loader, Pagination, Stack, Title } from '@mantine/core';
import Models3DList from '@/components/Models3DList';
import Upload3DModelModal from '@/components/Upload3DModelModal';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import useModels from '@/pages/User/pages/Models/useModels.ts';

export default function ModelsPage() {
  useDocumentTitle('Модели');

  const { models, isModelsLoading, page, setPage, totalPages } = useModels();

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
          <Models3DList models={models} emptyLabel="Ваш список 3D моделей пуст" mode="user" />
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
