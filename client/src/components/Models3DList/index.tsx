import { Flex, Grid } from '@mantine/core';
import { Model3DResponseDto } from '@/api/dto.ts';
import EmptyData from '@/components/EmptyData';
import Model3DCard from './components/Model3DCard';

export interface Models3DList {
  mode?: 'user' | 'all';
  models: Model3DResponseDto[];
  emptyLabel: string;
}

export default function Models3DList({ models, emptyLabel }: Models3DList) {
  if (!models.length) {
    return (
      <Flex align="center" justify="center" style={{ flex: 1 }}>
        <EmptyData label={emptyLabel} width={164} />
      </Flex>
    );
  }

  return (
    <Grid align="stretch">
      {models.map((model) => (
        <Grid.Col key={model.id} span={{ base: 12, md: 6, lg: 4 }}>
          <Model3DCard model={model} />
        </Grid.Col>
      ))}
    </Grid>
  );
}
