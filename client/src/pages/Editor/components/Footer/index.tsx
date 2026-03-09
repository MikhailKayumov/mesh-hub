import { AppShell, Box, Group, Text } from '@mantine/core';
import { clsx } from 'clsx';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { type WebGLRenderer } from 'three';
import { useModel3DContext } from '@/shared/contexts/Model3DContext/useModel3DContext.ts';
import { formatBytes } from '@/shared/utils/format-bytes.ts';
import { ColorThemeSwitcher } from '@/widgets/ColorThemeSwitcher';
import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import classes from './Footer.module.scss';

export interface FooterProps {
  className?: string;
  viewer: Viewer | null;
}

export function Footer({ className, viewer }: FooterProps) {
  const [info, setInfo] = useState<Pick<WebGLRenderer['info'], 'render' | 'memory'> | null>(null);
  const model3D = useModel3DContext();

  useEffect(() => {
    if (!viewer) return;

    let elapsed = 0;
    const onRender = (delta: number) => {
      if (elapsed > 1) {
        setInfo({ ...viewer.renderer.getInfo() });
        elapsed = 0;
      } else {
        elapsed += delta;
      }
    };

    viewer.renderer.addCallback(onRender);

    return () => {
      viewer.renderer.removeCallback(onRender);
    };
  }, [viewer]);

  return (
    <AppShell.Footer className={clsx(classes.root, className)}>
      <Group align="center" h="100%" px={8} gap={16}>
        {model3D && (
          <Group className={classes['file-info']} gap={8}>
            <Group gap={4} className={clsx(classes['file-info-row'], classes['file-info-name'])}>
              <Text size="xs" className={classes['file-info-text']}>
                Name:
              </Text>
              <Text fw="bold" size="xs" className={classes['file-info-text']} truncate="end">
                {model3D.file.name}
              </Text>
            </Group>
            <Group gap={4} className={clsx(classes['file-info-row'], classes['file-info-created'])}>
              <Text size="xs" className={classes['file-info-text']}>
                Created:
              </Text>
              <Text size="xs" className={classes['file-info-text']}>
                {dayjs(model3D.createdAt).format('DD.MM.YYYY HH:MM')}
              </Text>
            </Group>
            <Group gap={4} className={clsx(classes['file-info-row'], classes['file-info-updated'])}>
              <Text size="xs" className={classes['file-info-text']}>
                Updated:
              </Text>
              <Text size="xs" className={classes['file-info-text']}>
                {dayjs(model3D.updatedAt).format('DD.MM.YYYY HH:MM')}
              </Text>
            </Group>
            <Group gap={4} className={clsx(classes['file-info-row'], classes['file-info-size'])}>
              <Text size="xs" className={classes['file-info-text']}>
                Size:
              </Text>
              <Text size="xs" fw="bold" className={classes['file-info-text']}>
                {formatBytes(model3D.file.size)}
              </Text>
            </Group>
          </Group>
        )}
        <Group gap={8} className={classes['render-info']}>
          <Group gap={4}>
            <Text size="xs">Triangles:</Text>
            <Text size="xs">{info?.render.triangles}</Text>
          </Group>
          <Group gap={4}>
            <Text size="xs">Lines:</Text>
            <Text size="xs">{info?.render.lines}</Text>
          </Group>
          <Group gap={4}>
            <Text size="xs">Points:</Text>
            <Text size="xs">{info?.render.points}</Text>
          </Group>
          <Group gap={4}>
            <Text size="xs">Draw calls:</Text>
            <Text size="xs">{info?.render.calls}</Text>
          </Group>
        </Group>
        <Box className={classes['color-theme-switcher']}>
          <ColorThemeSwitcher size={12} space={4} />
        </Box>
      </Group>
    </AppShell.Footer>
  );
}
