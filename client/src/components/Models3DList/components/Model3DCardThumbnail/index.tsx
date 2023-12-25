import { Card, Image, Skeleton } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Fallback from '@/components/Models3DList/components/Model3DCardThumbnail/fallback.tsx';
import classes from '@/components/Models3DList/Models3DList.module.scss';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import { getThumbnailSrc } from '@/utils/model3d.ts';

export interface Model3DCardThumbnail {
  id: string;
  fileId: string;
  thumbnail?: string;
}

export default function Model3DCardThumbnail({ id, fileId, thumbnail }: Model3DCardThumbnail) {
  const to = buildAbsolutePath([RouterPaths.Models, id]);

  const [showFallback, setShowFallback] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  const onLoad = () => {
    setThumbnailLoading(false);
  };
  const onError = () => {
    setThumbnailLoading(false);
    setShowFallback(true);
  };

  return (
    <Card.Section m={0} p={0}>
      <Skeleton visible={thumbnailLoading}>
        <Link to={to} className={classes.thumbnail}>
          {showFallback ? (
            <Fallback />
          ) : (
            <Image
              src={getThumbnailSrc(fileId, thumbnail) ?? ''}
              className={classes.image}
              onLoad={onLoad}
              onError={onError}
            />
          )}
        </Link>
      </Skeleton>
    </Card.Section>
  );
}
