import { PropsWithChildren, DetailedHTMLProps, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonVariant = 'filled' | 'outlined' | 'text';

export interface ButtonProps
  extends PropsWithChildren<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const ButtonClassNames = {
  common: `
    inline-flex items-center justify-between rounded border border-transparent font-normal
    transition duration-[234ms]
    disabled:cursor-not-allowed
    disabled:bg-slate-100
    dark:disabled:bg-slate-900
    disabled:text-slate-300
    dark:disabled:text-slate-600
  `,
  filled: `
    bg-blue-700 text-white
    enabled:hover:bg-blue-500 enabled:hover:shadow-md enabled:hover:shadow-blue-950/40
    enabled:active:bg-blue-700 enabled:active:shadow enabled:active:shadow-blue-950/30
    enabled:dark:shadow-none
  `,
  outlined: `
    text-blue-700 border-blue-700
    disabled:border-slate-100 dark:disabled:border-slate-900
    dark:enabled:text-blue-500 dark:enabled:border-blue-500
    enabled:hover:bg-blue-700 enabled:hover:text-white
    enabled:active:bg-blue-500/5 enabled:active:text-blue-700
    dark:enabled:hover:bg-blue-700 dark:enabled:hover:border-blue-700 dark:enabled:hover:text-white
    dark:enabled:active:bg-blue-700/5 dark:enabled:active:border-blue-500 dark:enabled:active:text-blue-500
  `,
  text: `
    disabled:bg-transparent
    text-blue-700
    dark:enabled:text-blue-500
    enabled:hover:bg-blue-600/10
    enabled:active:bg-blue-600/20
  `,
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
      className={twMerge(
        clsx(ButtonClassNames.common, ButtonClassNames[variant], ButtonClassNames.size[size], className),
      )}
    >
      {children}
    </button>
  );
}
