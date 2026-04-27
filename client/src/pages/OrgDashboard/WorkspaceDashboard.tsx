import { Button, Center, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceQuery } from '@/app/api/workspaces.ts';
import { RouterPaths } from '@/shared/router/paths.ts';

export function WorkspaceDashboardPage() {
  const { orgId, workspaceId } = useParams<{ orgId: string; workspaceId: string }>();
  const navigate = useNavigate();

  const { data: workspace, isLoading } = useWorkspaceQuery(workspaceId!, { skip: !workspaceId });

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

  return (
    <Stack p="lg">
      <Title order={2}>{workspace.name}</Title>
      <Text c="dimmed">Workspace dashboard</Text>
      <Group>
        <Button
          variant="default"
          onClick={() =>
            navigate(
              `/${RouterPaths.Org}/${orgId}/${RouterPaths.WorkspaceSeg}/${workspaceId}/${RouterPaths.Scenes}`,
            )
          }
        >
          Scenes
        </Button>
      </Group>
    </Stack>
  );
}
