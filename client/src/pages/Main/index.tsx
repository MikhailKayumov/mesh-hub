import { Center, Container, Flex, Loader, Pagination, Stack, Tabs, Text } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { useCategoriesQuery } from '@/app/api/resources.ts';
import { useSession } from '@/entities/user/hooks';
import { useDocumentTitle } from '@/shared/hooks';
import { Models3DList } from '@/widgets/Models3DList';
import { HeroSection } from './components/HeroSection.tsx';
import { MainPageFilters } from './components/MainPageFilters.tsx';
import { PublicScenesList } from './components/PublicScenesList.tsx';
import classes from './MainPage.module.scss';
import { useModels3D } from './useModels3D.ts';

type Tab = 'models' | 'scenes';

export function MainPage() {
  useDocumentTitle('Главная');

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab | null) ?? 'models';

  const setTab = (value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'models') next.set('tab', value);
    else next.delete('tab');
    setSearchParams(Object.fromEntries(next.entries()));
  };

  const session = useSession();
  const { data: categoriesData } = useCategoriesQuery();
  const allCategories = categoriesData ?? [];

  const {
    models,
    isModelsLoading,
    isModelsFetching,
    page,
    setPage,
    totalPages,
    totalCount,
    search,
    setSearch,
    categories,
    setCategories,
    sort,
    setSort,
  } = useModels3D();

  const hasFilters = Boolean(search) || categories.length > 0;
  const emptyLabel = hasFilters ? 'Ничего не найдено по вашему запросу' : 'Список 3D моделей пуст';

  return (
    <Container fluid display="flex" className={classes.root}>
      <Stack gap={24} style={{ flex: 1 }}>
        <HeroSection isAuthenticated={Boolean(session)} search={search} onSearchChange={setSearch} />

        <Tabs value={tab} onChange={setTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="models">Модели</Tabs.Tab>
            <Tabs.Tab value="scenes">Сцены</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="models">
            <Stack gap={16}>
              <MainPageFilters
                allCategories={allCategories}
                selectedCategories={categories}
                onCategoriesChange={setCategories}
                sort={sort}
                onSortChange={setSort}
              />

              {!isModelsLoading && (
                <Text size="sm" c="dimmed">
                  Найдено {totalCount}{' '}
                  {totalCount === 1 ? 'модель' : totalCount >= 2 && totalCount <= 4 ? 'модели' : 'моделей'}
                </Text>
              )}

              <Stack gap={32} style={{ flex: 1 }} justify="space-between">
                {isModelsLoading || isModelsFetching ? (
                  <Flex align="center" justify="center" style={{ flex: 1 }}>
                    <Loader />
                  </Flex>
                ) : (
                  <Models3DList models={models} emptyLabel={emptyLabel} mode="all" />
                )}
                {totalPages > 1 && (
                  <Center>
                    <Pagination withEdges total={totalPages} value={page} onChange={setPage} size="sm" radius="sm" />
                  </Center>
                )}
              </Stack>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="scenes">
            <PublicScenesList search={search} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
