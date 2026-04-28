import { Divider, ScrollArea, Stack } from '@mantine/core';
import type { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import { ReviewPanel } from '@/widgets/ReviewPanel';
import { SceneAnnotationManager } from '@/widgets/SceneAnnotationManager';
import type { FC } from 'react';

interface SceneReviewPanelProps {
  sceneId: string;
  viewer: Viewer | null;
  onSelectObject: (sceneObjectId: string | null) => void;
}

export const SceneReviewPanel: FC<SceneReviewPanelProps> = ({ sceneId, viewer, onSelectObject }) => (
  <ScrollArea h="100%">
    <Stack gap="md" p="xs">
      <SceneAnnotationManager
        sceneId={sceneId}
        viewer={viewer}
        onSelectAnnotation={(id) => {
          if (id) onSelectObject(id);
        }}
      />
      <Divider />
      <ReviewPanel scope="scene" sceneId={sceneId} />
    </Stack>
  </ScrollArea>
);
