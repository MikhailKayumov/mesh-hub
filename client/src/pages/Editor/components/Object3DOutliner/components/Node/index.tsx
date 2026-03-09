import { type Object3DTreeNodeProps } from '../../model.ts';
import { TreeGroup } from '../Group';
import { TreeLeaf } from '../Leaf';

export function TreeNode({ item, isActive, ...props }: Object3DTreeNodeProps) {
  return item.children?.length ? (
    <TreeGroup item={item} {...props} />
  ) : (
    <TreeLeaf item={item} isActive={isActive} {...props} />
  );
}
