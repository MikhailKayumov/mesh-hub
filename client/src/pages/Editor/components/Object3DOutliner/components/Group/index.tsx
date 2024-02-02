import { ActionIcon, Box, Collapse, Group, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFolder, IconFolderOpen } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { MouseEvent } from 'react';
import { Object3DTreeGroupProps } from '../../model.ts';
import classes from '../../Object3DOutliner.module.scss';
import { TreeNode } from '../Node';

export function TreeGroup({ item, level, selected, selectNode, filterNode }: Object3DTreeGroupProps) {
  const [opened, { toggle }] = useDisclosure();
  const isActive = !!selected.find((s) => s.object.uuid === item.uuid);

  const onClick = () => {
    selectNode?.({ object: item, level });
  };
  const onExpand = (event: MouseEvent<HTMLDivElement>) => {
    if (!isActive) {
      selectNode?.({ object: item, level });
    }

    toggle();

    event.stopPropagation();
  };

  return (
    <Box className={clsx(classes.group)}>
      <UnstyledButton
        size="xs"
        className={clsx(classes.row, classes.leaf, isActive && classes.active)}
        onClick={onClick}
      >
        <Group gap={4} pl={16 * level} wrap="nowrap" className={clsx(classes.cell, classes['name-column'])}>
          <ActionIcon component="div" variant="transparent" className={classes['folder-button']} onClick={onExpand}>
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
