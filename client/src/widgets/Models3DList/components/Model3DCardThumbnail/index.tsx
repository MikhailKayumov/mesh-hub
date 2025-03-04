import { Card, Image, Skeleton } from '@mantine/core';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RouterPaths } from '@/shared/router/paths.ts';
import { getThumbnailSrc } from '@/shared/utils/model3d.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
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
  const src = useMemo(() => getThumbnailSrc(fileId, thumbnail), [fileId, thumbnail]);

  const [showFallback, setShowFallback] = useState(!src);
  const [isLoading, setLoading] = useState(!!src);

  return (
    <Card.Section m={0} p={0}>
      <Skeleton visible={isLoading}>
        <Link to={to} className={classes.thumbnail}>
          {showFallback ? (
            <Fallback />
          ) : (
            <Image
              key={src}
              alt={name}
              decoding="sync"
              loading="eager"
              src={src}
              className={classes.image}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setShowFallback(true);
              }}
            />
          )}
        </Link>
      </Skeleton>
    </Card.Section>
  );
}
