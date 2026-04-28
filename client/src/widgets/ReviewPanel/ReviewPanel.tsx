import { ActionIcon, Avatar, Box, Button, Group, Stack, Text, Textarea, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconMapPin, IconMessagePlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import type { CommentResponseDto, SceneCommentResponseDto } from '@/app/api/dto.ts';
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useModelCommentsQuery,
  useUpdateCommentMutation,
} from '@/app/api/reviews.ts';
import {
  useAddSceneCommentMutation,
  useDeleteSceneCommentMutation,
  useSceneCommentsQuery,
  useUpdateSceneCommentMutation,
} from '@/app/api/scene-reviews.ts';
import { useCurrentUserQuery } from '@/app/api/user.ts';
import type { Viewer } from '../Model3DViewer/classes/Viewer';
import classes from './ReviewPanel.module.scss';

export type ReviewScope = 'model' | 'scene';

export interface ReviewPanelProps {
  scope?: ReviewScope;
  modelId?: string;
  sceneId?: string;
  viewer?: Viewer | null;
}

interface UnifiedAuthor {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface UnifiedComment {
  id: string;
  body: string;
  pos: { x: number; y: number; z: number } | null;
  resolved: boolean;
  parentId: string | null;
  author: UnifiedAuthor;
  createdAt: string;
}

interface CommentFormValues {
  body: string;
}

function toUnifiedFromModel(c: CommentResponseDto): UnifiedComment {
  return {
    id: c.id,
    body: c.body,
    pos: c.pos,
    resolved: c.resolved,
    parentId: c.parentId,
    author: {
      id: c.author.id,
      firstName: c.author.firstName,
      lastName: c.author.lastName,
      avatar: c.author.avatar,
    },
    createdAt: c.createdAt,
  };
}

function toUnifiedFromScene(c: SceneCommentResponseDto): UnifiedComment {
  return {
    id: c.id,
    body: c.body,
    pos: null,
    resolved: c.resolved,
    parentId: c.parentId,
    author: {
      id: c.author.id,
      firstName: c.author.firstName,
      lastName: c.author.lastName,
      avatar: c.author.avatarUrl,
    },
    createdAt: c.createdAt,
  };
}

function flattenSceneComments(comments: SceneCommentResponseDto[]): SceneCommentResponseDto[] {
  const out: SceneCommentResponseDto[] = [];
  const walk = (list: SceneCommentResponseDto[]) => {
    for (const c of list) {
      out.push(c);
      if (c.replies?.length) walk(c.replies);
    }
  };
  walk(comments);
  return out;
}

interface ScopeAdapter {
  add: (body: {
    body: string;
    posX?: number;
    posY?: number;
    posZ?: number;
    parentId?: string | null;
  }) => Promise<unknown>;
  isAddLoading: boolean;
  remove: (commentId: string) => void;
  resolve: (commentId: string) => void;
}

function useModelAdapter(modelId: string): ScopeAdapter {
  const [add, { isLoading }] = useAddCommentMutation();
  const [del] = useDeleteCommentMutation();
  const [upd] = useUpdateCommentMutation();
  return {
    add: (body) =>
      add({
        modelId,
        body: {
          body: body.body,
          posX: body.posX,
          posY: body.posY,
          posZ: body.posZ,
          parentId: body.parentId ?? undefined,
        },
      }).unwrap(),
    isAddLoading: isLoading,
    remove: (commentId) => {
      void del({ modelId, commentId });
    },
    resolve: (commentId) => {
      void upd({ modelId, commentId, body: { resolved: true } });
    },
  };
}

function useSceneAdapter(sceneId: string): ScopeAdapter {
  const [add, { isLoading }] = useAddSceneCommentMutation();
  const [del] = useDeleteSceneCommentMutation();
  const [upd] = useUpdateSceneCommentMutation();
  return {
    add: (body) =>
      add({
        sceneId,
        body: { body: body.body, parentId: body.parentId ?? undefined },
      }).unwrap(),
    isAddLoading: isLoading,
    remove: (commentId) => {
      void del({ sceneId, commentId });
    },
    resolve: (commentId) => {
      void upd({ sceneId, commentId, body: { resolved: true } });
    },
  };
}

function CommentInput({
  scope,
  posX,
  posY,
  posZ,
  parentId,
  adapter,
  onDone,
}: {
  scope: ReviewScope;
  posX?: number;
  posY?: number;
  posZ?: number;
  parentId?: string;
  adapter: ScopeAdapter;
  onDone: () => void;
}) {
  const form = useForm<CommentFormValues>({ initialValues: { body: '' } });

  const handleSubmit = async (values: CommentFormValues) => {
    if (!values.body.trim()) return;
    await adapter.add(
      scope === 'model' ? { body: values.body, posX, posY, posZ, parentId } : { body: values.body, parentId },
    );
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
        <Button variant="subtle" size="xs" onClick={onDone} disabled={adapter.isAddLoading}>
          Отмена
        </Button>
        <Button type="submit" size="xs" loading={adapter.isAddLoading}>
          Отправить
        </Button>
      </Group>
    </Box>
  );
}

function CommentCard({
  comment,
  scope,
  adapter,
  currentUserId,
  depth = 0,
  allComments,
}: {
  comment: UnifiedComment;
  scope: ReviewScope;
  adapter: ScopeAdapter;
  currentUserId: string | undefined;
  depth?: number;
  allComments: UnifiedComment[];
}) {
  const [replyOpen, setReplyOpen] = useState(false);

  const authorName = [comment.author.firstName, comment.author.lastName].filter(Boolean).join(' ') || 'Аноним';
  const isAuthenticated = Boolean(currentUserId);
  const isOwn = isAuthenticated && currentUserId === comment.author.id;
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
            {isAuthenticated && (
              <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => setReplyOpen((v) => !v)}>
                Ответить
              </Text>
            )}
            {isOwn && (
              <ActionIcon size="xs" variant="subtle" color="red" onClick={() => adapter.remove(comment.id)}>
                <IconTrash size={12} />
              </ActionIcon>
            )}
            {isOwn && !comment.resolved && (
              <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => adapter.resolve(comment.id)}>
                Закрыть
              </Text>
            )}
          </Group>
          {replyOpen && isAuthenticated && (
            <Box mt={8}>
              <CommentInput scope={scope} parentId={comment.id} adapter={adapter} onDone={() => setReplyOpen(false)} />
            </Box>
          )}
        </Box>
      </Group>
      {replies.map((r) => (
        <CommentCard
          key={r.id}
          comment={r}
          scope={scope}
          adapter={adapter}
          currentUserId={currentUserId}
          depth={depth + 1}
          allComments={allComments}
        />
      ))}
    </Box>
  );
}

function ModelReview({ modelId, viewer }: { modelId: string; viewer: Viewer | null | undefined }) {
  const { data: comments = [] } = useModelCommentsQuery({ modelId }, { skip: !modelId });
  const { data: currentUser } = useCurrentUserQuery();
  const adapter = useModelAdapter(modelId);
  const [placementActive, setPlacementActive] = useState(false);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number; z: number } | null>(null);

  const unified = comments.map(toUnifiedFromModel);
  const rootComments = unified.filter((c) => !c.parentId);

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
            scope="model"
            adapter={adapter}
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
            scope="model"
            adapter={adapter}
            currentUserId={currentUser?.id}
            allComments={unified}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function SceneReview({ sceneId }: { sceneId: string }) {
  const { data: comments = [] } = useSceneCommentsQuery(sceneId, { skip: !sceneId });
  const { data: currentUser } = useCurrentUserQuery();
  const adapter = useSceneAdapter(sceneId);
  const [composerOpen, setComposerOpen] = useState(false);
  const isAuthenticated = Boolean(currentUser?.id);

  // Server may return either a flat list with parentId or nested replies — handle both.
  const unified = flattenSceneComments(comments).map(toUnifiedFromScene);
  const rootComments = unified.filter((c) => !c.parentId);

  return (
    <Stack gap="md" className={classes.root}>
      <Group justify="space-between" align="center">
        <Text fw={600} size="sm">
          Комментарии
        </Text>
        {isAuthenticated && (
          <Tooltip label="Новый комментарий" openDelay={300}>
            <ActionIcon
              variant={composerOpen ? 'filled' : 'light'}
              color={composerOpen ? 'orange' : 'blue'}
              onClick={() => setComposerOpen((v) => !v)}
            >
              <IconMessagePlus size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {composerOpen && isAuthenticated && (
        <Box className={classes['pending-input']}>
          <CommentInput scope="scene" adapter={adapter} onDone={() => setComposerOpen(false)} />
        </Box>
      )}

      {rootComments.length === 0 && !composerOpen && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          Комментариев пока нет
        </Text>
      )}

      <Stack gap="xs">
        {rootComments.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            scope="scene"
            adapter={adapter}
            currentUserId={currentUser?.id}
            allComments={unified}
          />
        ))}
      </Stack>
    </Stack>
  );
}

export function ReviewPanel({ scope = 'model', modelId, sceneId, viewer }: ReviewPanelProps) {
  if (scope === 'scene') {
    return <SceneReview sceneId={sceneId ?? ''} />;
  }
  return <ModelReview modelId={modelId ?? ''} viewer={viewer ?? null} />;
}
