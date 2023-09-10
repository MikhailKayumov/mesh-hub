'use client';

import { PropsWithChildren, DetailedHTMLProps, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonVariant = 'filled' | 'outlined' | 'text';

export interface ButtonProps
  extends PropsWithChildren<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const ButtonClassNames = {
  common:
    'flex items-center justify-between rounded transition duration-[174ms] disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-300 dark:disabled:text-slate-600',
  filled:
    'bg-blue-700 text-white enabled:hover:bg-blue-600 enabled:active:bg-blue-800 enabled:hover:shadow enabled:hover:shadow-blue-600 enabled:active:shadow-none',
  outlined:
    'text-blue-700 border border-blue-700 disabled:border-slate-200 dark:disabled:border-slate-600 enabled:hover:border-blue-600 enabled:active:border-blue-800 enabled:hover:text-blue-600 enabled:active:text-blue-800 enabled:hover:shadow-md enabled:hover:shadow-blue-800/30 enabled:active:shadow enabled:active:shadow-blue-800/30',
  text: 'text-blue-700 enabled:hover:text-blue-600 enabled:active:text-blue-800 enabled:hover:bg-blue-600/10 enabled:active:bg-blue-800/10',
  size: {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1',
    lg: 'px-4 py-1.5',
  },
} as const;

export default function Button({
  children,
  size = 'lg',
  className,
  variant = 'filled',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={clsx(ButtonClassNames.common, ButtonClassNames[variant], ButtonClassNames.size[size], className)}>
      {children}
    </button>
  );
}
