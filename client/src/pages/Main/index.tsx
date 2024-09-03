import { Center, Container, Flex, Loader, Pagination, Stack } from '@mantine/core';
import { Models3DList } from '@/components/Models3DList';
import { useDocumentTitle } from '@/shared/hooks';
import classes from './MainPage.module.scss';
import { useModels3D } from './useModels3D.ts';

export function MainPage() {
  useDocumentTitle('Главная');

  const { models, isModelsLoading, isModelsFetching, page, setPage, totalPages } = useModels3D();

  return (
    <Container fluid display="flex" className={classes.root}>
      {/*<Text mb="lg">todo: add filters</Text>*/}
      {
        <Stack gap={32} style={{ flex: 1 }} justify="space-between">
          {isModelsLoading || isModelsFetching ? (
            <Flex align="center" justify="center" style={{ flex: 1 }}>
              <Loader />
            </Flex>
          ) : (
            <Models3DList models={models} emptyLabel="Список 3D моделей пуст" mode="all" />
          )}
          {totalPages > 1 && (
            <Center>
              <Pagination withEdges total={totalPages} value={page} onChange={setPage} size="sm" radius="sm" />
            </Center>
          )}
        </Stack>
      }
    </Container>
  );
}
