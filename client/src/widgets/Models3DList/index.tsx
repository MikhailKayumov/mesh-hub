import { Flex, Grid, type GridColProps } from '@mantine/core';
import type { Model3DResponseDto } from '@/app/api/dto.ts';
import { EmptyData } from '../../widgets/EmptyData';
import { Model3DCard } from './components/Model3DCard';
import classes from './Models3DList.module.scss';

export interface Models3DList {
  mode?: 'user' | 'all';
  models: Model3DResponseDto[];
  emptyLabel: string;
  span?: GridColProps['span'];
}

export function Models3DList({ models, emptyLabel, span = { xxs: 12, xs: 6, md: 4, lg: 4, xl: 3 } }: Models3DList) {
  if (!models.length) {
    return (
      <Flex align="center" justify="center" style={{ flex: 1 }}>
        <EmptyData label={emptyLabel} width={164} />
      </Flex>
    );
  }

  return (
    <Grid align="stretch" className={classes.root}>
      {models.map((model) => (
        <Grid.Col key={model.id} span={span} className={classes.root}>
          <Model3DCard model={model} />
        </Grid.Col>
      ))}
    </Grid>
  );
}
