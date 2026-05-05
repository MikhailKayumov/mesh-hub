import { Anchor, Box, Card, Center, Flex, Image, Loader, SimpleGrid, Text } from '@mantine/core';
import { IconBoxModel, IconPhoto } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { usePublicScenesQuery } from '@/app/api/scenes.ts';
import { RouterPaths } from '@/shared/router/paths';

interface PublicScenesListProps {
  search?: string;
}

export function PublicScenesList({ search }: PublicScenesListProps) {
  const { data: scenes, isLoading } = usePublicScenesQuery({ search });

  if (isLoading) {
    return (
      <Flex align="center" justify="center" py="xl">
        <Loader />
      </Flex>
    );
  }

  if (!scenes?.length) {
    return (
      <Center py="xl">
        <Text c="dimmed" size="sm">
          {search ? 'Сцены не найдены по запросу' : 'Публичных сцен пока нет'}
        </Text>
      </Center>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 6 }} spacing="sm">
      {scenes.map((scene) => (
        <Anchor key={scene.id} component={Link} to={`/${RouterPaths.Scenes}/${scene.id}`} underline="never" c="inherit">
          <Card padding={0} radius="md" withBorder style={{ overflow: 'hidden' }}>
            <Box style={{ aspectRatio: '16/9', background: 'var(--mantine-color-dark-6)', overflow: 'hidden' }}>
              {scene.thumbnailPath ? (
                <Image src={scene.thumbnailPath} alt={scene.name} w="100%" h="100%" fit="cover" />
              ) : (
                <Flex align="center" justify="center" h="100%">
                  <IconPhoto size={32} style={{ opacity: 0.25 }} />
                </Flex>
              )}
            </Box>
            <Box p="xs">
              <Text size="sm" fw={500} lineClamp={1} title={scene.name}>
                {scene.name}
              </Text>
              <Flex align="center" gap={4} mt={2}>
                <IconBoxModel size={12} style={{ opacity: 0.5 }} />
                <Text size="xs" c="dimmed">
                  {scene.objectCount}{' '}
                  {scene.objectCount === 1
                    ? 'объект'
                    : scene.objectCount >= 2 && scene.objectCount <= 4
                      ? 'объекта'
                      : 'объектов'}
                </Text>
              </Flex>
            </Box>
          </Card>
        </Anchor>
      ))}
    </SimpleGrid>
  );
}
