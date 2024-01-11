import { Box } from '@mantine/core';
import { useFullscreen } from '@mantine/hooks';
import Model3DViewerBottomBar from './components/Model3DViewerBottomBar';
import Model3DViewerTopBar from './components/Model3DViewerTopBar';
import { ViewerContextProvider } from './context.tsx';
import usePreventMiddleClick from './hooks/usePreventMiddleClick.ts';
import useViewer, { UseViewerProps } from './hooks/useViewer.ts';
import classes from './Viewer.module.scss';

export interface Model3DPageViewerProps extends UseViewerProps {}

export default function Model3DViewer(props: Model3DPageViewerProps) {
  const { onMouseEnter, onMouseLeave } = usePreventMiddleClick();
  const { placeRef, viewer } = useViewer(props);
  const { ref: rootRef, toggle: toggleFullscreen, fullscreen } = useFullscreen();

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
