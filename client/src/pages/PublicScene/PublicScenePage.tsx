import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLock, IconMessage, IconPencil } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSceneQuery } from '@/app/api/scenes.ts';
import { useCurrentUserQuery } from '@/app/api/user.ts';
import { isHttpException } from '@/app/api/utils.ts';
import { useDocumentTitle } from '@/shared/hooks';
import { RouterPaths } from '@/shared/router/paths.ts';
import { pushRecent } from '@/shared/utils/recentlyOpened.ts';
import { buildAbsolutePath } from '@/shared/utils/router.ts';
import { ReviewPanel } from '@/widgets/ReviewPanel';
import { SceneAnnotationManager } from '@/widgets/SceneAnnotationManager';
import { usePublicSceneViewer } from './hooks/usePublicSceneViewer';
import classes from './PublicScenePage.module.scss';

export function PublicScenePage() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const {
    data: scene,
    isLoading: isSceneLoading,
    error: sceneError,
  } = useSceneQuery({ sceneId: sceneId! }, { skip: !sceneId });
  const { data: currentUser } = useCurrentUserQuery();
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  useDocumentTitle(scene?.name ?? 'Scene');

  useEffect(() => {
    if (!currentUser?.id || !scene?.id) return;
    pushRecent(currentUser.id, 'scene', {
      id: scene.id,
      name: scene.name,
      thumbnail: scene.thumbnailPath ?? null,
      updatedAt: scene.updatedAt,
    });
  }, [currentUser?.id, scene?.id, scene?.name, scene?.thumbnailPath, scene?.updatedAt]);

  const { containerRef, viewer, isSceneLoading: isViewerSceneLoading, selectObject } = usePublicSceneViewer({ scene });

  if (isSceneLoading) {
    return (
      <Center h="100dvh">
        <Loader />
      </Center>
    );
  }

  const isAccessDenied = isHttpException(sceneError) && (sceneError.status === 403 || sceneError.status === 404);

  if (isAccessDenied || (!scene && sceneError)) {
    return (
      <Center className={classes['access-denied']} h="100dvh">
        <Stack align="center" gap="md">
          <IconLock size={48} color="var(--mantine-color-dimmed)" />
          <Title order={3}>Private Scene</Title>
          <Text c="dimmed" ta="center" maw={360}>
            This scene is private. Request access from the owner.
          </Text>
          <Button variant="light" component={Link} to={buildAbsolutePath(RouterPaths.Base)}>
            Browse Public Scenes
          </Button>
        </Stack>
      </Center>
    );
  }

  if (!scene) {
    return null;
  }

  const canEdit = Boolean(currentUser?.id && scene.userId === currentUser.id);
  const editorHref =
    scene.workspaceId == null ? buildAbsolutePath([RouterPaths.User, RouterPaths.UserScenes, scene.id]) : null;

  const aside = (
    <Stack gap="md">
      <SceneAnnotationManager sceneId={scene.id} viewer={viewer} readOnly onSelectAnnotation={selectObject} />
      <Divider />
      <ReviewPanel scope="scene" sceneId={scene.id} />
    </Stack>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          {scene.thumbnailPath && <Avatar src={scene.thumbnailPath} radius="sm" size={36} />}
          <Box style={{ minWidth: 0 }}>
            <Title order={4} lineClamp={1}>
              {scene.name}
            </Title>
            {scene.description && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {scene.description}
              </Text>
            )}
          </Box>
        </Group>
        {canEdit && editorHref && (
          <Button component={Link} to={editorHref} leftSection={<IconPencil size={16} />} variant="light">
            Open in Editor
          </Button>
        )}
      </Group>

      <Box className={classes.layout}>
        <Paper withBorder p={0} className={classes['viewer-pane']}>
          <Box ref={containerRef} className={classes['viewer-canvas']} />
          {isViewerSceneLoading && (
            <Center className={classes['viewer-loader']}>
              <Loader />
            </Center>
          )}
        </Paper>

        <Paper withBorder className={classes.aside} visibleFrom="md">
          {aside}
        </Paper>
      </Box>

      <Tooltip label="Comments & annotations" position="left">
        <ActionIcon
          className={classes.fab}
          size="xl"
          radius="xl"
          variant="filled"
          onClick={openDrawer}
          hiddenFrom="md"
          aria-label="Open comments and annotations"
        >
          <IconMessage size={20} />
        </ActionIcon>
      </Tooltip>

      <Drawer opened={drawerOpened} onClose={closeDrawer} position="right" size="90vw" title="Review" hiddenFrom="md">
        {aside}
      </Drawer>
    </Stack>
  );
}
