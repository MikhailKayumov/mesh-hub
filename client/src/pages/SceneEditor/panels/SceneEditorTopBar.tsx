import { ActionIcon, Anchor, Breadcrumbs, Group, Text, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconCamera } from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import { useUploadSceneThumbnailMutation } from '@/app/api/scenes.ts';
import { RouterPaths } from '@/shared/router/paths.ts';

interface Props {
    scene: SceneResponseDto;
    captureScreenshot: () => string | null;
}

export function SceneEditorTopBar({ scene, captureScreenshot }: Props) {
    const { orgId, workspaceId } = useParams<{ orgId: string; workspaceId: string }>();
    const [uploadThumbnail, { isLoading }] = useUploadSceneThumbnailMutation();

    const scenesHref = `/${RouterPaths.Org}/${orgId}/${RouterPaths.WorkspaceSeg}/${workspaceId}/${RouterPaths.Scenes}`;

    const handleCapture = async () => {
        const base64 = captureScreenshot();
        if (!base64) return;
        await uploadThumbnail({ sceneId: scene.id, thumbnail: base64 }).unwrap().catch(() => { });
    };

    return (
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <ActionIcon component={Link} to={scenesHref} variant="subtle" aria-label="Back to scenes">
                    <IconArrowLeft size={18} />
                </ActionIcon>
                <Breadcrumbs>
                    <Anchor component={Link} to={scenesHref} size="sm">
                        Scenes
                    </Anchor>
                    <Text size="sm" fw={500}>
                        {scene.name}
                    </Text>
                </Breadcrumbs>
            </Group>

            <Tooltip label="Capture thumbnail">
                <ActionIcon
                    variant="default"
                    loading={isLoading}
                    onClick={handleCapture}
                    aria-label="Capture thumbnail"
                >
                    <IconCamera size={16} />
                </ActionIcon>
            </Tooltip>
        </Group>
    );
}
