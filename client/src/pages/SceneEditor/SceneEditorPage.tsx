import { AppShell, Box, Center, Loader, Text } from '@mantine/core';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSceneQuery } from '@/app/api/scenes.ts';
import { useCurrentUser } from '@/entities/user/hooks/useCurrentUser.ts';
import { useDocumentTitle } from '@/shared/hooks';
import { pushRecent } from '@/shared/utils/recentlyOpened.ts';
import { SceneNavbar } from './components/Navbar/SceneNavbar';
import { useSceneViewer } from './hooks/useSceneViewer';
import { SceneEditorTopBar } from './panels/SceneEditorTopBar';
import { ScenePropertiesPanel } from './panels/ScenePropertiesPanel';
import classes from './SceneEditorPage.module.scss';

export function SceneEditorPage() {
  const { sceneId } = useParams<{ sceneId: string }>();

  const { data: scene, isLoading: isSceneDataLoading } = useSceneQuery({ sceneId: sceneId! }, { skip: !sceneId });
  const { user } = useCurrentUser();

  useDocumentTitle(scene?.name ?? 'Scene Editor');

  useEffect(() => {
    if (!user?.id || !scene?.id) return;
    pushRecent(user.id, 'scene', {
      id: scene.id,
      name: scene.name,
      thumbnail: scene.thumbnailPath ?? null,
      updatedAt: scene.updatedAt,
    });
  }, [user?.id, scene?.id, scene?.name, scene?.thumbnailPath, scene?.updatedAt]);

  const {
    containerRef,
    viewer,
    isSceneLoading,
    selectionState,
    selectObject,
    selectLight,
    captureScreenshot,
    updateBackgroundColor,
    updateAmbientLight,
    loadHdri,
    syncLights,
    getObjectAnimations,
    getObjectMixer,
    getAnimatedObjectIds,
  } = useSceneViewer({ scene });

  if (isSceneDataLoading) {
    return (
      <Center h="100dvh">
        <Loader />
      </Center>
    );
  }

  if (!scene) {
    return (
      <Center h="100dvh">
        <Text c="dimmed">Scene not found.</Text>
      </Center>
    );
  }

  return (
    <AppShell
      header={{ height: 52 }}
      navbar={{ width: 260, breakpoint: 'sm' }}
      aside={{ width: 280, breakpoint: 'md', collapsed: { mobile: !selectionState } }}
      padding={0}
      className={classes.root}
    >
      <AppShell.Header>
        <SceneEditorTopBar scene={scene} captureScreenshot={captureScreenshot} />
      </AppShell.Header>

      <SceneNavbar
        scene={scene}
        viewer={viewer}
        selectionState={selectionState}
        onSelectObject={selectObject}
        onSelectLight={selectLight}
        syncLights={syncLights}
        updateBackgroundColor={updateBackgroundColor}
        updateAmbientLight={updateAmbientLight}
        loadHdri={loadHdri}
        getObjectAnimations={getObjectAnimations}
        getObjectMixer={getObjectMixer}
        getAnimatedObjectIds={getAnimatedObjectIds}
        isSceneLoading={isSceneLoading}
      />

      <AppShell.Main>
        <Box ref={containerRef} className={classes.canvas} />
        {isSceneLoading && (
          <Center className={classes.loadingOverlay}>
            <Loader />
          </Center>
        )}
      </AppShell.Main>

      <AppShell.Aside p={0}>
        <ScenePropertiesPanel scene={scene} selectionState={selectionState} syncLights={syncLights} />
      </AppShell.Aside>
    </AppShell>
  );
}
