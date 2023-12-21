import { Avatar, Card, Group, Image, rem, Skeleton, Text, Tooltip } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Model3DResponseDto } from '@/api/dto.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import { getThumbnailSrc } from '@/utils/model3d.ts';
import { getAvatarSrcByString } from '@/utils/user.ts';
import classes from '../../Models3DList.module.scss';
import fallback from './model-3d-thumbnail-fallback.jpg';

export interface Model3DCard extends Model3DResponseDto {}

export default function Model3DCard({ name, ownerAvatar, ownerName, id, file, thumbnail }: Model3DCard) {
  const to = buildAbsolutePath([RouterPaths.Models, id]);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  return (
    <Card withBorder className={classes.card} p={0} shadow="sm">
      <Card.Section>
        <Skeleton visible={thumbnailLoading}>
          <Link to={to}>
            <Image
              src={getThumbnailSrc(file.id, thumbnail)}
              fallbackSrc={fallback}
              className={classes.thumbnail}
              onLoad={() => setThumbnailLoading(false)}
              onError={() => setThumbnailLoading(false)}
            />
          </Link>
        </Skeleton>
      </Card.Section>

      <Group wrap="nowrap" gap={0} p="xs" py="xs">
        <Tooltip label={ownerName} withArrow position="bottom-start" openDelay={500} fz={12} lh={rem(17)}>
          <Avatar radius="xs" src={getAvatarSrcByString(ownerAvatar)} size={22}></Avatar>
        </Tooltip>
        <Tooltip
          multiline
          maw={260}
          withArrow
          label={name}
          position="bottom-start"
          openDelay={500}
          fz={12}
          lh={rem(17)}
        >
          <Text c="text" ml={6} size="sm" truncate="end" className={classes['model-name']} component={Link} to={to}>
            {name}
          </Text>
        </Tooltip>
        {/*{isOwner && (*/}
        {/*  <ActionIcon variant="transparent" c="dimmed" ml={14} mr={-10}>*/}
        {/*    <IconDotsVertical size={22} />*/}
        {/*  </ActionIcon>*/}
        {/*)}*/}
      </Group>
    </Card>
  );
}
