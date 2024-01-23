import { AppShell, Group, Text } from '@mantine/core';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { WebGLRenderer } from 'three';
import { Viewer } from '@/components/Model3DViewer/classes/Viewer';
import classes from './Footer.module.scss';

export interface FooterProps {
  className?: string;
  viewer: Viewer | null;
}

export function Footer({ className, viewer }: FooterProps) {
  const [info, setInfo] = useState<Pick<WebGLRenderer['info'], 'render' | 'memory'> | null>(null);

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
      <Group align="center" h="100%" px={8} gap={0}>
        <Group gap={8} ml="auto">
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
      </Group>
    </AppShell.Footer>
  );
}
