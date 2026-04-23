import { useEffect, useState } from 'react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Collapse,
    Group,
    Modal,
    Stack,
    Text,
    TextInput,
    Textarea,
    Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
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
import { IconGripVertical, IconMapPin, IconPlus, IconTrash } from '@tabler/icons-react';
import {
    useCreateAnnotationMutation,
    useDeleteAnnotationMutation,
    useModelAnnotationsQuery,
    useReorderAnnotationsMutation,
} from '@/app/api/reviews.ts';
import type { AnnotationResponseDto } from '@/app/api/dto.ts';
import { useViewerReviews } from '../Model3DViewer/hooks/useViewerReviews.ts';
import type { Viewer } from '../Model3DViewer/classes/Viewer';
import classes from './AnnotationManager.module.scss';

export interface AnnotationManagerProps {
    modelId: string;
    viewer: Viewer | null;
    canEdit: boolean;
}

interface AnnotationFormValues {
    label: string;
    body: string;
}

function SortableAnnotationCard({
    annotation,
    index,
    modelId,
    viewer,
    canEdit,
}: {
    annotation: AnnotationResponseDto;
    index: number;
    modelId: string;
    viewer: Viewer | null;
    canEdit: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [deleteAnnotation] = useDeleteAnnotationMutation();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: annotation.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

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
    };

    return (
        <Box ref={setNodeRef} style={style} className={classes.card}>
            <Group gap={6} wrap="nowrap" align="flex-start">
                {canEdit && (
                    <Box {...attributes} {...listeners} className={classes['drag-handle']}>
                        <IconGripVertical size={14} />
                    </Box>
                )}
                <Badge size="sm" circle variant="filled" className={classes.badge}>
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
                        <Tooltip label="Перелететь к аннотации" openDelay={400}>
                            <ActionIcon size="xs" variant="subtle" onClick={handleFlyTo}>
                                <IconMapPin size={13} />
                            </ActionIcon>
                        </Tooltip>
                        {canEdit && (
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={() => deleteAnnotation({ modelId, id: annotation.id })}
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
                </Box>
            </Group>
        </Box>
    );
}

export function AnnotationManager({ modelId, viewer, canEdit }: AnnotationManagerProps) {
    const { data: annotations = [] } = useModelAnnotationsQuery({ modelId }, { skip: !modelId });
    const [createAnnotation, { isLoading: isCreating }] = useCreateAnnotationMutation();
    const [reorderAnnotations] = useReorderAnnotationsMutation();
    const { pending, clearPending, startPlacement } = useViewerReviews(viewer, modelId);
    const [modalOpen, setModalOpen] = useState(false);
    const form = useForm<AnnotationFormValues>({ initialValues: { label: '', body: '' } });

    // Open modal when placement position is captured
    useEffect(() => {
        if (pending?.mode === 'annotate') {
            setModalOpen(true);
        }
    }, [pending]);
    useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = annotations.findIndex((a) => a.id === active.id);
        const newIndex = annotations.findIndex((a) => a.id === over.id);
        const reordered = arrayMove(annotations, oldIndex, newIndex);
        reorderAnnotations({ modelId, body: { ids: reordered.map((a) => a.id) } });
    };

    const handleAddClick = () => {
        startPlacement('annotate');
    };

    const handleModalClose = () => {
        clearPending();
        form.reset();
        setModalOpen(false);
    };

    const handleCreate = async (values: AnnotationFormValues) => {
        if (!pending) return;
        await createAnnotation({
            modelId,
            body: {
                label: values.label,
                body: values.body || undefined,
                posX: pending.worldPos.x,
                posY: pending.worldPos.y,
                posZ: pending.worldPos.z,
                cameraPosX: pending.cameraPos.x,
                cameraPosY: pending.cameraPos.y,
                cameraPosZ: pending.cameraPos.z,
                order: annotations.length,
            },
        });
        handleModalClose();
    };

    return (
        <Stack gap="sm" className={classes.root}>
            <Group justify="space-between" align="center">
                <Text fw={600} size="sm">
                    Аннотации
                </Text>
                {canEdit && (
                    <Tooltip label="Добавить аннотацию (кликните на модель)" openDelay={300}>
                        <ActionIcon variant="light" onClick={handleAddClick}>
                            <IconPlus size={16} />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>

            {annotations.length === 0 && (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                    Аннотаций пока нет
                </Text>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={annotations.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                    <Stack gap={4}>
                        {annotations.map((ann, i) => (
                            <SortableAnnotationCard
                                key={ann.id}
                                annotation={ann}
                                index={i}
                                modelId={modelId}
                                viewer={viewer}
                                canEdit={canEdit}
                            />
                        ))}
                    </Stack>
                </SortableContext>
            </DndContext>

            <Modal
                opened={modalOpen && !!pending}
                onClose={handleModalClose}
                title="Новая аннотация"
                centered
                size="sm"
            >
                <Box component="form" onSubmit={form.onSubmit(handleCreate)}>
                    <TextInput
                        {...form.getInputProps('label')}
                        label="Название"
                        placeholder="Название аннотации"
                        required
                        mb="sm"
                    />
                    <Textarea
                        {...form.getInputProps('body')}
                        label="Описание"
                        placeholder="Дополнительное описание (необязательно)"
                        autosize
                        minRows={2}
                        maxRows={5}
                        mb="md"
                    />
                    <Group justify="flex-end" gap={8}>
                        <Button variant="subtle" onClick={handleModalClose}>
                            Отмена
                        </Button>
                        <Button type="submit" loading={isCreating}>
                            Создать
                        </Button>
                    </Group>
                </Box>
            </Modal>
        </Stack>
    );
}
