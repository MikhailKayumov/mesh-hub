'use client';
import { memo, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { run } from './classes';
import styles from './Viewer.module.scss';

export interface ViewerProps {
  className?: string;
}

// @refresh reset
export const Viewer = memo(({ className }: ViewerProps) => {
  const rootRef = useRef<HTMLDivElement>();
  const getRootRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    rootRef.current = node;

    run(node).catch(e => console.error(e));
  }, []);

  return <div className={clsx(styles.root, className)} ref={getRootRef}></div>;
});
