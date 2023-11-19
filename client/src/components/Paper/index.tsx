import { PropsWithChildren } from 'react';
import { clsx } from 'clsx';

export interface PaperProps extends PropsWithChildren {
  className?: string;
}

export function Paper({ className, children }: PaperProps) {
  return (
    <div
      className={clsx(
        `
          rounded-md border border-transparent bg-white
          p-4 shadow-lg dark:border-slate-600
          dark:bg-transparent dark:shadow-none
        `,
        className,
      )}
    >
      {children}
    </div>
  );
}
