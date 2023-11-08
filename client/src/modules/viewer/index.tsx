import { useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { run } from './classes';

export interface ViewerProps {
  className?: string;
}

// @refresh reset
export default function Viewer({ className }: ViewerProps) {
  const rootRef = useRef<HTMLDivElement>();
  const viewerRef = useRef<ReturnType<typeof run> | null>(null);

  const getRootRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || rootRef.current === node) return;

    rootRef.current = node;

    run(node).then((data) => {
      viewerRef.current = data as any;
    });
  }, []);

  return <div className={clsx('relative h-full w-full', className)} ref={getRootRef}></div>;
}
