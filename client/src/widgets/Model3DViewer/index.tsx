import { Box, Button, Overlay } from '@mantine/core';
import { useFullscreenElement } from '@mantine/hooks';
import { IconVolume } from '@tabler/icons-react';
import { useSyncExternalStore } from 'react';
import { useListModelAudioQuery } from '@/app/api/audio.ts';
import { Model3DViewerBottomBar } from './components/Model3DViewerBottomBar';
import { Model3DViewerTopBar } from './components/Model3DViewerTopBar';
import { ViewerContextProvider } from './context.tsx';
import { usePreventMiddleClick } from './hooks/usePreventMiddleClick.ts';
import { useViewer, type UseViewerProps } from './hooks/useViewer.ts';
import classes from './Viewer.module.scss';

export type Model3DPageViewerProps = UseViewerProps;

function useAudioContextState(ctx: AudioContext | null): AudioContextState | null {
  return useSyncExternalStore(
    (notify) => {
      if (!ctx) return () => undefined;
      ctx.addEventListener('statechange', notify);
      return () => ctx.removeEventListener('statechange', notify);
    },
    () => ctx?.state ?? null,
    () => null,
  );
}

export function Model3DViewer(props: Model3DPageViewerProps) {
  const { onMouseEnter, onMouseLeave } = usePreventMiddleClick();
  const { placeRef, viewer } = useViewer(props);
  const { ref: rootRef, toggle: toggleFullscreen, fullscreen } = useFullscreenElement();
  const modelId = props.model?.id;

  const { data: audioTracks = [] } = useListModelAudioQuery({ modelId: modelId! }, { skip: !modelId });

  const audioState = useAudioContextState(viewer?.audioContext ?? null);
  const audioSuspended = audioState === 'suspended' && audioTracks.length > 0;

  const handleUnlockAudio = () => {
    viewer?.audioContext?.resume();
  };

  return (
    <ViewerContextProvider viewer={viewer}>
      <Box ref={rootRef} className={classes.root} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <Model3DViewerTopBar />
        <Box ref={placeRef} className={classes.viewer} />
        {audioSuspended && (
          <>
            <Overlay backgroundOpacity={0.3} zIndex={10} />
            <Button
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 11 }}
              leftSection={<IconVolume size={16} />}
              onClick={handleUnlockAudio}
              variant="filled"
            >
              Click to enable audio
            </Button>
          </>
        )}
        <Model3DViewerBottomBar
          fullscreen={fullscreen}
          toggleFullscreen={toggleFullscreen}
          modelId={modelId}
          viewer={viewer ?? undefined}
        />
      </Box>
    </ViewerContextProvider>
  );
}
