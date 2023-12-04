import { ForwardedRef } from 'react';

export default function mergeRefs<T>(...refs: Array<ForwardedRef<T>>) {
  return (node: T) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }

      typeof ref === 'function' ? ref(node) : (ref.current = node);
    }
  };
}
