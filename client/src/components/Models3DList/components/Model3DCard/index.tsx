import { Avatar, Card, Group, Text, Tooltip } from '@mantine/core';
import { Link } from 'react-router-dom';
import { Model3DResponseDto } from '@/api/dto.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import { getAvatarSrcByString } from '@/utils/user.ts';
import classes from '../../Models3DList.module.scss';
import Model3DCardThumbnail from '../Model3DCardThumbnail';

export interface Model3DCard {
  model: Model3DResponseDto;
}

export default function Model3DCard({ model }: Model3DCard) {
  return (
    <Card withBorder className={classes.card} p={0}>
      <Model3DCardThumbnail id={model.id} fileId={model.file.id} thumbnail={model.thumbnail} />
      <Group wrap="nowrap" gap={0} p="xs" py="xs">
        <Tooltip label={model.ownerName} withArrow position="top-start" offset={1} openDelay={500}>
          <Avatar radius="xs" src={getAvatarSrcByString(model.ownerAvatar)} color="primary" size={22}></Avatar>
        </Tooltip>
        <Tooltip label={model.name} position="top-start" openDelay={500}>
          <Text
            c="text"
            ml={6}
            size="sm"
            truncate="end"
            className={classes['model-name']}
            component={Link}
            to={buildAbsolutePath([RouterPaths.Models, model.id])}
          >
            {model.name}
          </Text>
        </Tooltip>
      </Group>
    </Card>
  );
}
