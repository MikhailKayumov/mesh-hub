import { Stack } from '@mantine/core';
import { Object3DTreeProps } from '../../model.ts';
import { TreeHeader } from '../Header';
import { TreeNode } from '../Node';

export function Tree({ data, selected, filterNode, selectNode }: Object3DTreeProps) {
  return (
    <Stack gap={0}>
      <TreeHeader />
      {data.map((item) => (
        <TreeNode
          level={0}
          key={item.uuid}
          item={item}
          isActive={!!selected.find((s) => s.object.uuid === item.uuid)}
          selected={selected}
          filterNode={filterNode}
          selectNode={selectNode}
        />
      ))}
    </Stack>
  );
}
