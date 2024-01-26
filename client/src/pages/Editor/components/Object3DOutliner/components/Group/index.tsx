import { Box, Collapse, Group, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFolder, IconFolderOpen } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { Object3DTreeGroupProps } from '../../model.ts';
import classes from '../../Object3DOutliner.module.scss';
import { TreeNode } from '../Node';

export function TreeGroup({ item, level, selected, selectNode, filterNode }: Object3DTreeGroupProps) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <Box className={clsx(classes.group)}>
      <UnstyledButton size="xs" className={clsx(classes.row, classes.leaf)} onClick={toggle}>
        <Group gap={4} wrap="nowrap" className={clsx(classes.cell, classes['name-column'])}>
          {opened ? (
            <IconFolderOpen className={classes['group-arrow-icon']} />
          ) : (
            <IconFolder className={classes['group-arrow-icon']} />
          )}
          <Text>{item.name || item.type || 'Unknown name'}</Text>
        </Group>
        <Group wrap="nowrap" className={clsx(classes.cell, classes['type-column'])}>
          <Text truncate="end" fz={11}>
            {item.type}
          </Text>
        </Group>
      </UnstyledButton>

      <Collapse in={opened} title={`${item.name} (${item.type})`}>
        {item.children.map((child) => (
          <TreeNode
            key={child.uuid}
            item={child}
            level={level + 1}
            selected={selected}
            isActive={!!selected.find((s) => s.object.uuid === child.uuid)}
            selectNode={selectNode}
            filterNode={filterNode}
          />
        ))}
      </Collapse>
    </Box>
  );
}
