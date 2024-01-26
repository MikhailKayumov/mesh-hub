import { Box, Group, Text } from '@mantine/core';
import { clsx } from 'clsx';
import classes from '../../Object3DOutliner.module.scss';

export function TreeHeader() {
  return (
    <Group wrap="nowrap" className={clsx(classes.row, classes['header-row'])}>
      <Box className={clsx(classes.cell, classes['header-cell'], classes['name-column'])}>
        <Text fw={600} truncate="end">
          Name
        </Text>
      </Box>
      <Box className={clsx(classes.cell, classes['header-cell'], classes['type-column'])}>
        <Text fw={600} truncate="end">
          Type
        </Text>
      </Box>
    </Group>
  );
}
