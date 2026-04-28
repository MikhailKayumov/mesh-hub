import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
  Timeline,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCube, IconGripVertical, IconMapPin, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Vector3 } from 'three';
import type { SceneAnnotationResponseDto } from '@/app/api/dto.ts';
import {
  useCreateSceneAnnotationMutation,
  useDeleteSceneAnnotationMutation,
  useReorderSceneAnnotationsMutation,
  useSceneAnnotationsQuery,
} from '@/app/api/scene-reviews.ts';
import { EmptyData } from '@/widgets/EmptyData';
import type { Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import classes from './SceneAnnotationManager.module.scss';

export interface SceneAnnotationManagerProps {
  sceneId: string;
  viewer: Viewer | null;
  onSelectAnnotation?: (sceneObjectId: string | null) => void;
  readOnly?: boolean;
}

interface PendingPlacement {
  worldPos: Vector3;
  cameraPos: Vector3;
  sceneObjectId: string | null;
}

interface AnnotationFormValues {
  label: string;
  body: string;
}

interface SortableAnnotationCardProps {
  annotation: SceneAnnotationResponseDto;
  index: number;
  sceneId: string;
  viewer: Viewer | null;
  selected: boolean;
  readOnly: boolean;
  onSelect: (annotation: SceneAnnotationResponseDto) => void;
  onHighlightObject: (sceneObjectId: string | null) => void;
}

function SortableAnnotationCard({
  annotation,
  index,
  sceneId,
  viewer,
  selected,
  readOnly,
  onSelect,
  onHighlightObject,
}: SortableAnnotationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteAnnotation] = useDeleteSceneAnnotationMutation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: annotation.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const authorName = [annotation.author.firstName, annotation.author.lastName].filter(Boolean).join(' ') || 'Аноним';

  const handleFlyTo = () => {
    if (!viewer) return;
    if (annotation.cameraPos) {
      viewer.camera.flyTo(
        annotation.cameraPos.x,
        annotation.cameraPos.y,
        annotation.cameraPos.z,
        annotation.pos.x,
        annotation.pos.y,
        annotation.pos.z,
      );
    }
    viewer.world.highlightMarker(annotation.id);
    onSelect(annotation);
  };

  return (
    <Box ref={setNodeRef} style={style} className={clsx(classes.card, selected && classes.selected)}>
      <Group gap={6} wrap="nowrap" align="flex-start">
        {!readOnly && (
          <Box {...attributes} {...listeners} className={classes['drag-handle']}>
            <IconGripVertical size={14} />
          </Box>
        )}
        <Badge size="sm" circle variant="filled">
          {index + 1}
        </Badge>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap">
            <Text
              size="sm"
              fw={500}
              style={{ cursor: annotation.body ? 'pointer' : 'default', flex: 1, minWidth: 0 }}
              lineClamp={1}
              onClick={() => annotation.body && setExpanded((v) => !v)}
            >
              {annotation.label}
            </Text>
            <Tooltip label="Fly to" openDelay={400}>
              <ActionIcon size="xs" variant="subtle" onClick={handleFlyTo}>
                <IconMapPin size={13} />
              </ActionIcon>
            </Tooltip>
            {annotation.sceneObjectId && (
              <Tooltip label="Highlight linked object" openDelay={400}>
                <ActionIcon size="xs" variant="subtle" onClick={() => onHighlightObject(annotation.sceneObjectId)}>
                  <IconCube size={13} />
                </ActionIcon>
              </Tooltip>
            )}
            {!readOnly && (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => deleteAnnotation({ sceneId, annotationId: annotation.id })}
              >
                <IconTrash size={13} />
              </ActionIcon>
            )}
          </Group>
          {annotation.body && (
            <Collapse in={expanded}>
              <Text size="xs" c="dimmed" mt={4} style={{ whiteSpace: 'pre-wrap' }}>
                {annotation.body}
              </Text>
            </Collapse>
          )}
          <Group gap={6} mt={6} wrap="nowrap">
            <Avatar src={annotation.author.avatarUrl} size={18} radius="xl" />
            <Text size="xs" c="dimmed" lineClamp={1}>
              {authorName}
            </Text>
          </Group>
        </Box>
      </Group>
    </Box>
  );
}

export function SceneAnnotationManager({
  sceneId,
  viewer,
  onSelectAnnotation,
  readOnly = false,
}: SceneAnnotationManagerProps) {
  const { data: annotations = [] } = useSceneAnnotationsQuery(sceneId, { skip: !sceneId });
  const [createAnnotation, { isLoading: isCreating }] = useCreateSceneAnnotationMutation();
  const [reorderAnnotations] = useReorderSceneAnnotationsMutation();

  const [annotateActive, setAnnotateActive] = useState(false);
  const [pending, setPending] = useState<PendingPlacement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const form = useForm<AnnotationFormValues>({ initialValues: { label: '', body: '' } });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Sync annotation markers into the scene
  useEffect(() => {
    if (!viewer) return;
    viewer.world.clearMarkers();
    for (const ann of annotations) {
      viewer.world.spawnMarker(ann.id, new Vector3(ann.pos.x, ann.pos.y, ann.pos.z));
    }
  }, [viewer, annotations]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = annotations.findIndex((a) => a.id === active.id);
    const newIndex = annotations.findIndex((a) => a.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(annotations, oldIndex, newIndex);
    reorderAnnotations({
      sceneId,
      body: { items: reordered.map((a, i) => ({ id: a.id, order: i })) },
    });
  };

  const startAnnotate = () => {
    if (!viewer) return;
    setAnnotateActive(true);
    viewer.setMode('annotate');
    viewer.onScenePointerDown((worldPos, cameraPos, sceneObjectId) => {
      setPending({ worldPos, cameraPos, sceneObjectId });
      setAnnotateActive(false);
    });
  };

  const cancelAnnotate = () => {
    viewer?.setMode('view');
    setAnnotateActive(false);
  };

  const cancelPending = () => {
    setPending(null);
    form.reset();
  };

  const handleCreate = async (values: AnnotationFormValues) => {
    if (!pending) return;
    await createAnnotation({
      sceneId,
      body: {
        label: values.label,
        body: values.body || undefined,
        posX: pending.worldPos.x,
        posY: pending.worldPos.y,
        posZ: pending.worldPos.z,
        cameraPosX: pending.cameraPos.x,
        cameraPosY: pending.cameraPos.y,
        cameraPosZ: pending.cameraPos.z,
        sceneObjectId: pending.sceneObjectId,
      },
    });
    cancelPending();
  };

  const handleSelect = (ann: SceneAnnotationResponseDto) => {
    const idx = annotations.findIndex((a) => a.id === ann.id);
    setSelectedIndex(idx);
  };

  const handleHighlightObject = (sceneObjectId: string | null) => {
    onSelectAnnotation?.(sceneObjectId);
  };

  return (
    <Stack gap="sm" className={classes.root}>
      <Group justify="space-between" align="center">
        <Text fw={600} size="sm">
          Annotations
        </Text>
        {!readOnly && (
          <Tooltip label={annotateActive ? 'Click on the scene to place a pin' : 'Annotate'} openDelay={300}>
            <ActionIcon
              variant={annotateActive ? 'filled' : 'light'}
              color={annotateActive ? 'orange' : 'blue'}
              onClick={annotateActive ? cancelAnnotate : startAnnotate}
              disabled={!viewer}
            >
              {annotateActive ? <IconX size={16} /> : <IconPlus size={16} />}
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {!readOnly && pending && (
        <Box className={classes['pending-form']} component="form" onSubmit={form.onSubmit(handleCreate)}>
          <Text size="xs" c="dimmed" mb={6}>
            New annotation
            {pending.sceneObjectId && ' · linked to clicked object'}
          </Text>
          <TextInput {...form.getInputProps('label')} placeholder="Label" required size="xs" mb="xs" />
          <Textarea
            {...form.getInputProps('body')}
            placeholder="Description (optional)"
            autosize
            minRows={2}
            maxRows={5}
            size="xs"
            mb="xs"
          />
          <Group justify="flex-end" gap={6}>
            <Button size="xs" variant="subtle" onClick={cancelPending} disabled={isCreating}>
              Cancel
            </Button>
            <Button size="xs" type="submit" loading={isCreating}>
              Create
            </Button>
          </Group>
        </Box>
      )}

      {annotations.length === 0 && !pending && (
        <EmptyData label={readOnly ? 'No annotations yet' : 'Click Annotate to add the first pin'} labelSize="sm" />
      )}

      {annotations.length > 0 && readOnly && (
        <Timeline active={selectedIndex} bulletSize={20} lineWidth={2}>
          {annotations.map((ann, i) => (
            <Timeline.Item key={ann.id} bullet={<IconMapPin size={12} />} title={null}>
              <SortableAnnotationCard
                annotation={ann}
                index={i}
                sceneId={sceneId}
                viewer={viewer}
                selected={selectedIndex === i}
                readOnly
                onSelect={handleSelect}
                onHighlightObject={handleHighlightObject}
              />
            </Timeline.Item>
          ))}
        </Timeline>
      )}

      {annotations.length > 0 && !readOnly && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={annotations.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <Timeline active={selectedIndex} bulletSize={20} lineWidth={2}>
              {annotations.map((ann, i) => (
                <Timeline.Item key={ann.id} bullet={<IconMapPin size={12} />} title={null}>
                  <SortableAnnotationCard
                    annotation={ann}
                    index={i}
                    sceneId={sceneId}
                    viewer={viewer}
                    selected={selectedIndex === i}
                    readOnly={false}
                    onSelect={handleSelect}
                    onHighlightObject={handleHighlightObject}
                  />
                </Timeline.Item>
              ))}
            </Timeline>
          </SortableContext>
        </DndContext>
      )}
    </Stack>
  );
}
