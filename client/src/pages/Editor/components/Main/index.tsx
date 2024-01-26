import { AppShell, Box, LoadingOverlay } from '@mantine/core';
import { Model3DResponseDto } from '@/api/dto.ts';
import Model3DViewer from '@/components/Model3DViewer';
import { UseViewerProps } from '@/components/Model3DViewer/hooks/useViewer.ts';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';
import classes from '@/pages/Editor/EditorPage.module.scss';
import { isNil } from '@/utils/type-guards.ts';

export interface MainProps {
  model: Model3DResponseDto | null;
  isLoading?: boolean;

  onViewerInit?: UseViewerProps['onInit'];
  onViewerReady?: UseViewerProps['onReady'];
}

export function Main({ model, isLoading, onViewerInit, onViewerReady }: MainProps) {
  const { isLight } = useCurrentColorScheme();

  return (
    <AppShell.Main className={classes.main} bg={isLight ? 'gray.0' : 'dark.7'}>
      <Box className={classes['viewer-box']}>
        <Model3DViewer
          model={model} //
          onInit={onViewerInit}
          onReady={onViewerReady}
        />
        {!isNil(isLoading) && <LoadingOverlay zIndex={10} className={classes['viewer-loader']} visible={isLoading} />}
      </Box>
    </AppShell.Main>
  );
}
