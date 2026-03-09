import { Stack } from '@mantine/core';
import { type Object3DTreeProps } from '../../model.ts';
import { TreeHeader } from '../Header';
import { TreeNode } from '../Node';

export function Tree({ data, selected, selectedSet, filterNode, selectNode }: Object3DTreeProps) {
  return (
    <Stack gap={0}>
      <TreeHeader />
      {data.map((item) => (
        <TreeNode
          level={0}
          key={item.uuid}
          item={item}
          isActive={selectedSet.has(item.uuid)}
          selected={selected}
          selectedSet={selectedSet}
          filterNode={filterNode}
          selectNode={selectNode}
        />
      ))}
    </Stack>
  );
}
