import { ActionIcon, Box, Collapse, Group, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFolder, IconFolderOpen } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { type MouseEvent } from 'react';
import { type Object3DTreeGroupProps } from '../../model.ts';
import classes from '../../Object3DOutliner.module.scss';
import { TreeNode } from '../Node';

export function TreeGroup({ item, level, selected, selectedSet, selectNode, filterNode }: Object3DTreeGroupProps) {
  const isActive = selectedSet.has(item.uuid);
  const isFiltered = filterNode && filterNode(item);
  const [opened, { toggle, open }] = useDisclosure(isActive);

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    !isActive && open();
    selectNode?.({ object: item, level });
  };
  const onExpand = (event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    toggle();
  };

  const children = item.children.map((child) => (
    <TreeNode
      key={child.uuid}
      item={child}
      level={level + (isFiltered ? 1 : 0)}
      selected={selected}
      selectedSet={selectedSet}
      isActive={selectedSet.has(child.uuid)}
      selectNode={selectNode}
      filterNode={filterNode}
    />
  ));

  if (!isFiltered) return children;

  return (
    <Box className={clsx(classes.group)}>
      <UnstyledButton
        size="xs"
        className={clsx(classes.row, classes.leaf, isActive && classes.active)}
        onClick={onClick}
      >
        <Group gap={4} pl={16 * level} wrap="nowrap" className={clsx(classes.cell, classes['name-column'])}>
          <ActionIcon
            variant="transparent"
            role="button"
            component="span"
            className={classes['folder-button']}
            onClick={onExpand}
          >
            {opened ? (
              <IconFolderOpen className={classes['group-arrow-icon']} />
            ) : (
              <IconFolder className={classes['group-arrow-icon']} />
            )}
          </ActionIcon>
          <Text>{item.name || item.type || 'Unknown name'}</Text>
        </Group>
        <Group wrap="nowrap" className={clsx(classes.cell, classes['type-column'])}>
          <Text truncate="end" fz={11}>
            {item.type}
          </Text>
        </Group>
      </UnstyledButton>

      <Collapse expanded={opened}>{children}</Collapse>
    </Box>
  );
}
