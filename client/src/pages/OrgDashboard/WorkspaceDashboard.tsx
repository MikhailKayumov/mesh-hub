import { Center, Loader, Stack, Text, Title } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useWorkspaceQuery } from '@/app/api/workspaces.ts';

export function WorkspaceDashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

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
      <Text c="dimmed">Workspace dashboard — coming soon.</Text>
    </Stack>
  );
}
