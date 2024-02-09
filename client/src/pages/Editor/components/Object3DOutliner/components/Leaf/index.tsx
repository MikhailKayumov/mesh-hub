import { Group, rem, Text, UnstyledButton } from '@mantine/core';
import { clsx } from 'clsx';
import { Object3DTreeLeafProps } from '../../model.ts';
import classes from '../../Object3DOutliner.module.scss';

export function TreeLeaf({ item, level, isActive, selectNode }: Object3DTreeLeafProps) {
  const onClick = () => selectNode?.({ object: item, level });

  return (
    <UnstyledButton size="xs" className={clsx(classes.row, classes.leaf, isActive && classes.active)} onClick={onClick}>
      <Group gap={4} wrap="nowrap" className={clsx(classes.cell, classes['name-column'])} pl={rem(level * 16)}>
        <Text truncate="end">{item.name || item.type || 'Unknown name'}</Text>
      </Group>
      <Group wrap="nowrap" className={clsx(classes.cell, classes['type-column'])}>
        <Text truncate="end">{item.type}</Text>
      </Group>
    </UnstyledButton>
  );
}
