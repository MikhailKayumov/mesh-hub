import { Button, Card, Center, Group, Image, Loader, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { IconCube, IconMovie } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceQuery } from '@/app/api/workspaces.ts';
import { useCurrentUser } from '@/entities/user/hooks/useCurrentUser.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { getThumbnailSrc } from '@/shared/utils/model3d.ts';
import { getRecent, type RecentItem } from '@/shared/utils/recentlyOpened.ts';
import { buildAbsolutePath } from '@/shared/utils/router.ts';

export function WorkspaceDashboardPage() {
  const { orgId, workspaceId } = useParams<{ orgId: string; workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const { data: workspace, isLoading } = useWorkspaceQuery(workspaceId!, { skip: !workspaceId });

  const recent = useMemo(() => getRecent(user?.id ?? ''), [user?.id]);
  const hasRecent = recent.models.length > 0 || recent.scenes.length > 0;

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  if (!workspace) {
    return (
      <Center h="100%">
        <Text c="dimmed">Workspace not found</Text>
      </Center>
    );
  }

  const handleOpenModel = (id: string) => {
    navigate(buildAbsolutePath([RouterPaths.Editor, id]));
  };
  const handleOpenScene = (id: string) => {
    navigate(buildAbsolutePath([RouterPaths.Scenes, id]));
  };

  return (
    <Stack p="lg">
      <Title order={2}>{workspace.name}</Title>
      <Text c="dimmed">Workspace dashboard</Text>

      {hasRecent && (
        <Stack gap="xs">
          <Title order={4}>Недавно открытые</Title>
          <ScrollArea offsetScrollbars scrollbarSize={6}>
            <Group gap="sm" wrap="nowrap" align="stretch">
              {recent.models.map((item) => (
                <RecentCard key={`model-${item.id}`} item={item} kind="model" onOpen={handleOpenModel} />
              ))}
              {recent.scenes.map((item) => (
                <RecentCard key={`scene-${item.id}`} item={item} kind="scene" onOpen={handleOpenScene} />
              ))}
            </Group>
          </ScrollArea>
        </Stack>
      )}

      <Group>
        <Button
          variant="default"
          onClick={() =>
            navigate(`/${RouterPaths.Org}/${orgId}/${RouterPaths.WorkspaceSeg}/${workspaceId}/${RouterPaths.Scenes}`)
          }
        >
          Scenes
        </Button>
      </Group>
    </Stack>
  );
}

interface RecentCardProps {
  item: RecentItem;
  kind: 'model' | 'scene';
  onOpen: (id: string) => void;
}

function RecentCard({ item, kind, onOpen }: RecentCardProps) {
  const thumb = kind === 'model' ? getThumbnailSrc(item.id, item.thumbnail ?? undefined) : (item.thumbnail ?? null);

  return (
    <Card
      withBorder
      padding="xs"
      style={{ cursor: 'pointer', minWidth: 160, maxWidth: 160 }}
      onClick={() => onOpen(item.id)}
    >
      <Card.Section>
        {thumb ? (
          <Image src={thumb} alt={item.name} h={90} fit="cover" />
        ) : (
          <Center h={90} bg="var(--mantine-color-default-hover)">
            {kind === 'model' ? (
              <IconCube size={28} color="var(--mantine-color-dimmed)" />
            ) : (
              <IconMovie size={28} color="var(--mantine-color-dimmed)" />
            )}
          </Center>
        )}
      </Card.Section>
      <Stack gap={2} mt="xs">
        <Text size="sm" fw={500} lineClamp={1}>
          {item.name}
        </Text>
        <Text size="xs" c="dimmed">
          {kind === 'model' ? 'Модель' : 'Сцена'}
        </Text>
      </Stack>
    </Card>
  );
}
