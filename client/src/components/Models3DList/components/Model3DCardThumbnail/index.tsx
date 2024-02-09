import { Card, Image, Skeleton } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RouterPaths } from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import { getThumbnailSrc } from '@/utils/model3d.ts';
import classes from '../../Models3DList.module.scss';
import { Fallback } from './fallback.tsx';

export interface Model3DCardThumbnail {
  id: string;
  fileId: string;
  name: string;
  thumbnail?: string;
}

export function Model3DCardThumbnail({ id, name, fileId, thumbnail }: Model3DCardThumbnail) {
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
              crossOrigin="use-credentials"
              alt={name}
              decoding="sync"
              loading="eager"
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
