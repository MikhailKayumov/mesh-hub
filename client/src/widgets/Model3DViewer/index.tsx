import { Box } from '@mantine/core';
import { useFullscreenElement } from '@mantine/hooks';
import { Model3DViewerBottomBar } from './components/Model3DViewerBottomBar';
import { Model3DViewerTopBar } from './components/Model3DViewerTopBar';
import { ViewerContextProvider } from './context.tsx';
import { usePreventMiddleClick } from './hooks/usePreventMiddleClick.ts';
import { useViewer, type UseViewerProps } from './hooks/useViewer.ts';
import classes from './Viewer.module.scss';

export type Model3DPageViewerProps = UseViewerProps;

export function Model3DViewer(props: Model3DPageViewerProps) {
  const { onMouseEnter, onMouseLeave } = usePreventMiddleClick();
  const { placeRef, viewer } = useViewer(props);
  const { ref: rootRef, toggle: toggleFullscreen, fullscreen } = useFullscreenElement();

  return (
    <ViewerContextProvider viewer={viewer}>
      <Box ref={rootRef} className={classes.root} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <Model3DViewerTopBar />
        <Box ref={placeRef} className={classes.viewer} />
        <Model3DViewerBottomBar fullscreen={fullscreen} toggleFullscreen={toggleFullscreen} />
      </Box>
    </ViewerContextProvider>
  );
}


return (
  <ViewerContextProvider viewer={viewer}>
    <Box ref={rootRef} className={classes.root} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Model3DViewerTopBar />
      <Box ref={placeRef} className={classes.viewer} />
      <Model3DViewerBottomBar fullscreen={fullscreen} toggleFullscreen={toggleFullscreen} />
    </Box>
  </ViewerContextProvider>
);
}
