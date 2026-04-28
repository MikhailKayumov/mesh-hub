import { AppShell, Box, Center, Loader, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/shared/hooks';
import { useSceneQuery } from '@/app/api/scenes.ts';
import { useSceneViewer } from './hooks/useSceneViewer';
import { SceneNavbar } from './components/Navbar/SceneNavbar';
import { SceneEditorTopBar } from './panels/SceneEditorTopBar';
import { ScenePropertiesPanel } from './panels/ScenePropertiesPanel';
import classes from './SceneEditorPage.module.scss';

export function SceneEditorPage() {
    const { sceneId } = useParams<{ sceneId: string }>();

    const { data: scene, isLoading: isSceneDataLoading } = useSceneQuery({ sceneId: sceneId! }, { skip: !sceneId });

    useDocumentTitle(scene?.name ?? 'Scene Editor');

    const {
        containerRef,
        isSceneLoading,
        selectionState,
        selectObject,
        selectLight,
        captureScreenshot,
        updateBackgroundColor,
        updateAmbientLight,
        loadHdri,
        syncLights,
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
                selectionState={selectionState}
                onSelectObject={selectObject}
                onSelectLight={selectLight}
                syncLights={syncLights}
                updateBackgroundColor={updateBackgroundColor}
                updateAmbientLight={updateAmbientLight}
                loadHdri={loadHdri}
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
                <ScenePropertiesPanel
                    scene={scene}
                    selectionState={selectionState}
                    syncLights={syncLights}
                />
            </AppShell.Aside>
        </AppShell>
    );
}
