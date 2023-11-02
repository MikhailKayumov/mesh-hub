import { useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { run } from './classes';

export interface ViewerProps {
  className?: string;
}

// @refresh reset
export default function Viewer({ className }: ViewerProps) {
  const rootRef = useRef<HTMLDivElement>();
  const getRootRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || rootRef.current === node) return;

    rootRef.current = node;

    run(node).catch((e) => console.error(e));
  }, []);

  return <div className={clsx('w-full h-full relative', className)} ref={getRootRef}></div>;
}
