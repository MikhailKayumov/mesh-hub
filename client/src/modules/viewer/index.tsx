import { Box } from '@mantine/core';
import { clsx } from 'clsx';
import { useCallback, useRef } from 'react';
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

  return <Box className={clsx(className)} w="100%" h="100%" ref={getRootRef}></Box>;
}
