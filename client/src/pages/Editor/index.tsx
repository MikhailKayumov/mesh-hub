import { AppShell, Box, LoadingOverlay, rem } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useModel3D } from '@/entities/model-3d';
import { Model3DContextProvider } from '@/shared/contexts/Model3DContext';
import { NotFoundError } from '@/widgets/Errors';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Main } from './components/Main';
import { Navbar } from './components/Navbar';
import classes from './EditorPage.module.scss';
import { useEditor } from './hooks/useEditor.ts';

const headerConfig = { height: rem(30) };
const footerConfig = { height: rem(26) };
const navbarConfig = { width: 360, breakpoint: 'sm', collapsed: { mobile: true } };

export function EditorPage() {
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
        <Navbar className={classes.navbar} viewer={viewer} modelId={id} />
        <Main model={model3d} onViewerReady={onViewerReady} />
        <Footer className={classes.footer} viewer={viewer} />
      </AppShell>
      <LoadingOverlay visible={isModelLoading || isViewerLoading} className={classes.loader} />
    </Model3DContextProvider>
  );
}
