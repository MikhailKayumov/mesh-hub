import { ActionIcon, Avatar, Box, Button, Group, Stack, Text, Textarea, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconMapPin, IconMessagePlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import type { CommentResponseDto } from '@/app/api/dto.ts';
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useModelCommentsQuery,
  useUpdateCommentMutation,
} from '@/app/api/reviews.ts';
import { useCurrentUserQuery } from '@/app/api/user.ts';
import type { Viewer } from '../Model3DViewer/classes/Viewer';
import classes from './ReviewPanel.module.scss';

export interface ReviewPanelProps {
  modelId: string;
  viewer: Viewer | null;
}

interface CommentFormValues {
  body: string;
}

function CommentInput({
  modelId,
  posX,
  posY,
  posZ,
  parentId,
  onDone,
}: {
  modelId: string;
  posX?: number;
  posY?: number;
  posZ?: number;
  parentId?: string;
  onDone: () => void;
}) {
  const [addComment, { isLoading }] = useAddCommentMutation();
  const form = useForm<CommentFormValues>({ initialValues: { body: '' } });

  const handleSubmit = async (values: CommentFormValues) => {
    if (!values.body.trim()) return;
    await addComment({ modelId, body: { body: values.body, posX, posY, posZ, parentId } });
    form.reset();
    onDone();
  };

  return (
    <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
      <Textarea
        {...form.getInputProps('body')}
        placeholder="Введите комментарий…"
        autosize
        minRows={2}
        maxRows={6}
        mb={8}
      />
      <Group justify="flex-end" gap={8}>
        <Button variant="subtle" size="xs" onClick={onDone} disabled={isLoading}>
          Отмена
        </Button>
        <Button type="submit" size="xs" loading={isLoading}>
          Отправить
        </Button>
      </Group>
    </Box>
  );
}

function CommentCard({
  comment,
  modelId,
  currentUserId,
  depth = 0,
  allComments,
}: {
  comment: CommentResponseDto;
  modelId: string;
  currentUserId: string | undefined;
  depth?: number;
  allComments: CommentResponseDto[];
}) {
  const [deleteComment] = useDeleteCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [replyOpen, setReplyOpen] = useState(false);

  const authorName = [comment.author.firstName, comment.author.lastName].filter(Boolean).join(' ') || 'Аноним';
  const isOwn = currentUserId === comment.author.id;
  const replies = allComments.filter((c) => c.parentId === comment.id);

  return (
    <Box ml={depth > 0 ? 'md' : 0} className={classes.comment}>
      <Group gap={8} align="flex-start" wrap="nowrap">
        <Avatar src={comment.author.avatar} size={28} radius="xl" />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} mb={2}>
            <Text size="xs" fw={600}>
              {authorName}
            </Text>
            {comment.pos && (
              <Tooltip label="Привязан к точке в сцене" openDelay={500}>
                <IconMapPin size={12} style={{ opacity: 0.5 }} />
              </Tooltip>
            )}
            {comment.resolved && (
              <Tooltip label="Решено" openDelay={500}>
                <IconCheck size={12} color="green" />
              </Tooltip>
            )}
          </Group>
          <Text size="sm" style={{ wordBreak: 'break-word' }}>
            {comment.body}
          </Text>
          <Group gap={6} mt={4}>
            <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => setReplyOpen((v) => !v)}>
              Ответить
            </Text>
            {isOwn && (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => deleteComment({ modelId, commentId: comment.id })}
              >
                <IconTrash size={12} />
              </ActionIcon>
            )}
            {isOwn && !comment.resolved && (
              <Text
                size="xs"
                c="dimmed"
                style={{ cursor: 'pointer' }}
                onClick={() => updateComment({ modelId, commentId: comment.id, body: { resolved: true } })}
              >
                Закрыть
              </Text>
            )}
          </Group>
          {replyOpen && (
            <Box mt={8}>
              <CommentInput modelId={modelId} parentId={comment.id} onDone={() => setReplyOpen(false)} />
            </Box>
          )}
        </Box>
      </Group>
      {replies.map((r) => (
        <CommentCard
          key={r.id}
          comment={r}
          modelId={modelId}
          currentUserId={currentUserId}
          depth={depth + 1}
          allComments={allComments}
        />
      ))}
    </Box>
  );
}

export function ReviewPanel({ modelId, viewer }: ReviewPanelProps) {
  const { data: comments = [] } = useModelCommentsQuery({ modelId }, { skip: !modelId });
  const { data: currentUser } = useCurrentUserQuery();
  const [placementActive, setPlacementActive] = useState(false);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number; z: number } | null>(null);

  const rootComments = comments.filter((c) => !c.parentId);

  const handlePlaceComment = () => {
    if (!viewer) return;
    setPlacementActive(true);
    viewer.setMode('comment');
    viewer.onScenePointerDown((worldPos) => {
      setPendingPos({ x: worldPos.x, y: worldPos.y, z: worldPos.z });
      setPlacementActive(false);
    });
  };

  const handlePlacementCancel = () => {
    viewer?.setMode('view');
    setPlacementActive(false);
    setPendingPos(null);
  };

  return (
    <Stack gap="md" className={classes.root}>
      <Group justify="space-between" align="center">
        <Text fw={600} size="sm">
          Комментарии
        </Text>
        <Tooltip label={placementActive ? 'Кликните на модель' : 'Разместить комментарий'} openDelay={300}>
          <ActionIcon
            variant={placementActive ? 'filled' : 'light'}
            color={placementActive ? 'orange' : 'blue'}
            onClick={placementActive ? handlePlacementCancel : handlePlaceComment}
          >
            <IconMessagePlus size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {pendingPos && (
        <Box className={classes['pending-input']}>
          <Text size="xs" c="dimmed" mb={6}>
            Комментарий в точке сцены
          </Text>
          <CommentInput
            modelId={modelId}
            posX={pendingPos.x}
            posY={pendingPos.y}
            posZ={pendingPos.z}
            onDone={() => setPendingPos(null)}
          />
        </Box>
      )}

      {rootComments.length === 0 && !pendingPos && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          Комментариев пока нет
        </Text>
      )}

      <Stack gap="xs">
        {rootComments.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            modelId={modelId}
            currentUserId={currentUser?.id}
            allComments={comments}
          />
        ))}
      </Stack>
    </Stack>
  );
}
