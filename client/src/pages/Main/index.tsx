import { Center, Container, Flex, Loader, Pagination, Stack } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { useEffect } from 'react';
import Models3DList from '@/components/Models3DList';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import useModels from './useModels.ts';

export default function MainPage() {
  useDocumentTitle('Главная');

  const { models, isModelsLoading, page, setPage, totalPages } = useModels();

  const [, scrollTo] = useWindowScroll();
  useEffect(() => scrollTo({ y: 0 }), [page]);

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
