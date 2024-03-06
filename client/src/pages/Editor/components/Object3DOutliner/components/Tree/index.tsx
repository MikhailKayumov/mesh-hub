import { Stack } from '@mantine/core';
import { Object3DTreeProps } from '../../model.ts';
import { TreeHeader } from '../Header';
import { TreeNode } from '../Node';

export function Tree({ data, selected, selectedRef, filterNode, selectNode }: Object3DTreeProps) {
  return (
    <Stack gap={0}>
      <TreeHeader />
      {data.map((item) => (
        <TreeNode
          level={0}
          key={item.uuid}
          item={item}
          isActive={selectedRef.current?.has(item.uuid)}
          selected={selected}
          selectedRef={selectedRef}
          filterNode={filterNode}
          selectNode={selectNode}
        />
      ))}
    </Stack>
  );
}
