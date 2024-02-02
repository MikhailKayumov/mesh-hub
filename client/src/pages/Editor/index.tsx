import { AppShell, Box, LoadingOverlay, rem } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { NotFoundError } from '@/components/Errors';
import Model3DContextProvider from '@/contexts/Model3DContext';
import useModel3D from '@/hooks/useModel3D.ts';
import { Footer } from '@/pages/Editor/components/Footer';
import Header from '@/pages/Editor/components/Header';
import { Main } from '@/pages/Editor/components/Main';
import Navbar from '@/pages/Editor/components/Navbar';
import { useEditor } from '@/pages/Editor/hooks/useEditor.ts';
import classes from './EditorPage.module.scss';

const headerConfig = { height: rem(30) };
const footerConfig = { height: rem(26) };
const navbarConfig = { width: 360, breakpoint: 'sm', collapsed: { mobile: true } };

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { model3d, isModelLoading } = useModel3D({ id });
  const { viewer, isViewerLoading, onViewerReady } = useEditor();

  if (!isModelLoading && !model3d) {
    return (
      <Box className={classes['not-found']}>
        <NotFoundError />
      </Box>
    );
  }

  return (
    <Model3DContextProvider model={model3d}>
      <AppShell h="100%" padding="md" header={headerConfig} footer={footerConfig} navbar={navbarConfig}>
        <Header className={classes.header} viewer={viewer} />
        <Navbar className={classes.navbar} viewer={viewer} />
        <Main model={model3d} onViewerReady={onViewerReady} />
        <Footer className={classes.footer} viewer={viewer} />
      </AppShell>
      <LoadingOverlay visible={isModelLoading || isViewerLoading} className={classes.loader} />
    </Model3DContextProvider>
  );
}
