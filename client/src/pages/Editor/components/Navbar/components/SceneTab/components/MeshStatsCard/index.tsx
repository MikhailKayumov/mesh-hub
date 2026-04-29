import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Box3, type Mesh, type Scene, Vector3 } from 'three';
import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import { WorldEventNames } from '@/widgets/Model3DViewer/classes/World';
import classes from './MeshStatsCard.module.scss';

export interface MeshStatsCardProps {
  viewer: Viewer | null;
}

interface MeshStats {
  meshCount: number;
  vertexCount: number;
  faceCount: number;
  materialCount: number;
  textureCount: number;
  bbox: { x: number; y: number; z: number };
}

const TEXTURE_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'] as const;

function computeStats(scene: Scene): MeshStats {
  let meshCount = 0;
  let vertexCount = 0;
  let faceCount = 0;
  const materials = new Set<number>();
  const textures = new Set<number>();

  scene.traverse((o) => {
    if (!(o as Mesh).isMesh) return;
    const mesh = o as Mesh;
    meshCount++;
    const pos = mesh.geometry.attributes.position;
    if (pos) vertexCount += pos.count;
    const idx = mesh.geometry.index;
    faceCount += idx ? idx.count / 3 : pos ? pos.count / 3 : 0;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      if (!m) return;
      materials.add((m as unknown as { id: number }).id);
      TEXTURE_KEYS.forEach((k) => {
        const t = (m as unknown as Record<string, { id?: number } | undefined>)[k];
        if (t?.id != null) textures.add(t.id);
      });
    });
  });

  const bbox = new Box3().setFromObject(scene);
  const size = new Vector3();
  if (!bbox.isEmpty()) bbox.getSize(size);

  return {
    meshCount,
    vertexCount,
    faceCount: Math.round(faceCount),
    materialCount: materials.size,
    textureCount: textures.size,
    bbox: { x: size.x, y: size.y, z: size.z },
  };
}

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU');
}

function formatSize(size: { x: number; y: number; z: number }): string {
  return `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} m`;
}

export function MeshStatsCard({ viewer }: MeshStatsCardProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!viewer) return;
    return viewer.world.on(WorldEventNames.WorldSceneChange, () => {
      setTick((v) => (v + 1) % 1024);
    });
  }, [viewer]);

  const stats = useMemo<MeshStats | null>(() => {
    if (!viewer) return null;
    // depends on tick: re-run when world emits scene change
    void tick;
    return computeStats(viewer.world.scene);
  }, [viewer, tick]);

  if (!stats) return null;

  const items: Array<{ label: string; value: string }> = [
    { label: 'Меши', value: formatNumber(stats.meshCount) },
    { label: 'Вершины', value: formatNumber(stats.vertexCount) },
    { label: 'Полигоны', value: formatNumber(stats.faceCount) },
    { label: 'Материалы', value: formatNumber(stats.materialCount) },
    { label: 'Текстуры', value: formatNumber(stats.textureCount) },
    { label: 'Размер', value: formatSize(stats.bbox) },
  ];

  return (
    <Stack gap={6} className={classes.root}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        Статистика
      </Text>
      <SimpleGrid cols={2} spacing="xs">
        {items.map((item) => (
          <Paper key={item.label} p="xs" withBorder radius="sm">
            <Text size="10px" c="dimmed" tt="uppercase">
              {item.label}
            </Text>
            <Text size="sm" fw={600} truncate>
              {item.value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
