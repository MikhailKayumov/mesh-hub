import { AppShell, Box, LoadingOverlay, rem, useSafeMantineTheme } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { NotFoundError } from '@/components/Errors';
import Model3DViewer from '@/components/Model3DViewer';
import { Viewer } from '@/components/Model3DViewer/classes/Viewer';
import Model3DContextProvider from '@/contexts/Model3DContext';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';
import useModel3D from '@/hooks/useModel3D.ts';
import { Footer } from '@/pages/Editor/components/Footer';
import Header from '@/pages/Editor/components/Header';
import Navbar from '@/pages/Editor/components/Navbar';
import classes from './EditorPage.module.scss';

const headerConfig = { height: rem(30) };
const footerConfig = { height: rem(26) };
const navbarConfig = { width: 360, breakpoint: 'sm', collapsed: { mobile: true } };

// @refresh reset
export default function EditorPage() {
  const { isLight } = useCurrentColorScheme();
  const { id } = useParams<{ id: string }>();
  const { model3d, isModelLoading } = useModel3D({ id });
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const theme = useSafeMantineTheme();

  // spawn helpers
  useEffect(() => {
    if (!viewer) return;

    viewer.world.spawnGridHelper(50, 50, theme.colors.dark[4], theme.colors.dark[6]);
    viewer.world.spawnAxisHelper(1.25);
    viewer.world.spawnGroundHelper('#ffffff', 1500, 1500, 1, 1, 1);
  }, [viewer, theme]);

  if (!isModelLoading && !model3d) {
    return <NotFoundError />;
  }

  return (
    <Model3DContextProvider model={model3d}>
      <AppShell
        h="100%" //
        padding="md"
        header={headerConfig}
        footer={footerConfig}
        navbar={navbarConfig}
      >
        <Header className={classes.header} viewer={viewer} />
        <Navbar className={classes.navbar} viewer={viewer} />

        <AppShell.Main className={classes.main} bg={isLight ? 'gray.0' : 'dark.7'}>
          <Box className={classes['viewer-box']}>
            <Model3DViewer
              model={model3d} //
              onInit={(v) => setViewer(v)}
              onReady={() => setIsViewerReady(true)}
            />
            <LoadingOverlay
              zIndex={10}
              className={classes['viewer-loader']}
              visible={isModelLoading || !isViewerReady}
            />
          </Box>
        </AppShell.Main>

        <Footer className={classes.footer} viewer={viewer} />
      </AppShell>
      <LoadingOverlay visible={isModelLoading} className={classes.loader} />
    </Model3DContextProvider>
  );
}
