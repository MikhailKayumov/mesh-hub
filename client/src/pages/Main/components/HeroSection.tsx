import { Box, Button, Group, Skeleton, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useModels3DStatsQuery } from '@/app/api/models-3d.ts';
import { useScenesStatsQuery } from '@/app/api/scenes.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router.ts';

const GRADIENT =
  'linear-gradient(119deg, var(--mantine-color-primary-9) 0%, var(--mantine-color-primary-8) 45%, var(--mantine-color-primary-5) 100%)';

function formatCount(n: number, one: string, few: string, many: string): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} ${one}`;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

interface HeroSectionProps {
  isAuthenticated: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

export function HeroSection({ isAuthenticated, search, onSearchChange }: HeroSectionProps) {
  const [inputValue, setInputValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const { data: modelStats, isLoading: modelStatsLoading } = useModels3DStatsQuery();
  const { data: sceneStats, isLoading: sceneStatsLoading } = useScenesStatsQuery();

  // Sync external search (URL) → local input (e.g. browser back/forward)
  if (search !== prevSearch) {
    setPrevSearch(search);
    setInputValue(search);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== search) {
        onSearchChange(inputValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const searchInput = (
    <TextInput
      placeholder="Поиск моделей и сцен..."
      size="lg"
      radius="xl"
      leftSection={<IconSearch size={18} />}
      value={inputValue}
      onChange={(e) => setInputValue(e.currentTarget.value)}
      style={{ width: '100%', maxWidth: 640 }}
      styles={{ input: { backgroundColor: 'rgba(255,255,255,0.96)' } }}
    />
  );

  const statsRow =
    modelStatsLoading || sceneStatsLoading ? (
      <Skeleton height={16} width={200} style={{ opacity: 0.4 }} />
    ) : (
      <Group gap="xs" justify="center">
        <Text size="sm" c="rgba(255,255,255,0.85)">
          {formatCount(modelStats?.totalModels ?? 0, 'модель', 'модели', 'моделей')}
        </Text>
        <Text size="sm" c="rgba(255,255,255,0.4)">
          ·
        </Text>
        <Text size="sm" c="rgba(255,255,255,0.85)">
          {formatCount(sceneStats?.totalScenes ?? 0, 'сцена', 'сцены', 'сцен')}
        </Text>
        <Text size="sm" c="rgba(255,255,255,0.4)">
          ·
        </Text>
        <Text size="sm" c="rgba(255,255,255,0.85)">
          GLB · GLTF · и другие
        </Text>
      </Group>
    );

  return (
    <Box
      style={{ background: GRADIENT, borderRadius: 'var(--mantine-radius-lg)' }}
      py={isAuthenticated ? 'xl' : '4rem'}
      px="xl"
    >
      <Stack gap="xl" align="center">
        <Stack gap="xs" align="center">
          <Title order={1} c="white" ta="center">
            Исследуйте 3D модели и сцены
          </Title>
          <Text size="lg" c="rgba(255,255,255,0.75)" ta="center" maw={540}>
            Открытая библиотека 3D-контента для дизайнеров и разработчиков — загружайте, просматривайте и делитесь прямо
            в браузере
          </Text>
        </Stack>

        {searchInput}
        {statsRow}

        {!isAuthenticated && (
          <Group gap="md">
            <Button
              component={Link}
              to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Login])}
              size="md"
              variant="white"
              color="dark"
            >
              Войти
            </Button>
            <Button
              component={Link}
              to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Register])}
              size="md"
              variant="outline"
              color="white"
            >
              Зарегистрироваться
            </Button>
          </Group>
        )}
      </Stack>
    </Box>
  );
}
