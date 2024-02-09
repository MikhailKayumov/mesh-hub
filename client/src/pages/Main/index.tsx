import { Center, Container, Flex, Loader, Pagination, Stack } from '@mantine/core';
import { Models3DList } from '@/components/Models3DList';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { useModels3D } from './useModels3D.ts';

export function MainPage() {
  useDocumentTitle('Главная');

  const { models, isModelsLoading, page, setPage, totalPages } = useModels3D();

  return (
    <Container style={{ flex: 1, flexDirection: 'column' }} display="flex">
      {/*<Text mb="lg">todo: add filters</Text>*/}
      {isModelsLoading ? (
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Loader />
        </Flex>
      ) : (
        <Stack gap={24} style={{ flex: 1 }}>
          <Models3DList models={models} emptyLabel="Список 3D моделей пуст" mode="all" />
          {totalPages > 1 && (
            <Center>
              <Pagination withEdges total={totalPages} value={page} onChange={setPage} size="sm" radius="sm" />
            </Center>
          )}
        </Stack>
      )}
    </Container>
  );
}
