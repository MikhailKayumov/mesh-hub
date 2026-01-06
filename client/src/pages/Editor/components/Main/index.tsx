import { AppShell, Box, LoadingOverlay } from '@mantine/core';
import type { Model3DResponseDto } from '@/app/api/dto.ts';
import classes from '@/pages/Editor/EditorPage.module.scss';
import { useCurrentColorScheme } from '@/shared/hooks/useCurrentColorScheme.ts';
import { isNil } from '@/shared/utils/type-guards.ts';
import { Model3DViewer } from '@/widgets/Model3DViewer';
import type { UseViewerProps } from '@/widgets/Model3DViewer/hooks/useViewer.ts';

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
