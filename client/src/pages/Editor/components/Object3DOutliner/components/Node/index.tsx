import { Object3DTreeNodeProps } from '../../model.ts';
import { TreeGroup } from '../Group';
import { TreeLeaf } from '../Leaf';

export function TreeNode({ item, filterNode, isActive, ...props }: Object3DTreeNodeProps) {
  if (filterNode && !filterNode(item)) return null;

  return item.children?.length ? (
    <TreeGroup item={item} filterNode={filterNode} {...props} />
  ) : (
    <TreeLeaf item={item} isActive={isActive} {...props} />
  );
}
