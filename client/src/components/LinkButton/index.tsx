import { clsx } from 'clsx';
import { Link, LinkProps } from 'react-router-dom';
import { PropsWithChildren, MouseEvent } from 'react';
import { twMerge } from 'tailwind-merge';
import { ButtonVariant, ButtonSize, ButtonClassNames } from '../Button';

export interface LinkButtonProps extends PropsWithChildren<LinkProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}

export const LinkButtonClassNames = {
  common: {
    enabled: ``,
    disabled: `
      cursor-not-allowed
      border-transparent
      bg-slate-100
      text-slate-300
      dark:bg-slate-900
      dark:text-slate-600
    `,
  },
  filled: {
    enabled: `
      bg-blue-700 text-white
      hover:bg-blue-500 hover:shadow-md hover:shadow-blue-950/40
      active:bg-blue-700 active:shadow active:shadow-blue-950/30
      dark:shadow-none
    `,
    disabled: ``,
  },
  outlined: {
    enabled: `
      text-blue-700 border-blue-700
      hover:bg-blue-700 hover:text-white
      active:bg-blue-500/5 active:text-blue-700
      dark:text-blue-500 dark:border-blue-500
      dark:hover:bg-blue-700 dark:hover:border-blue-700 dark:hover:text-white
      dark:active:bg-blue-700/5 dark:active:border-blue-500 dark:active:text-blue-500
    `,
    disabled: `
      bg-transparent
      border-slate-200
      dark:bg-transparent
      dark:border-slate-700
      dark:text-slate-600
    `,
  },
  text: {
    enabled: `
      px-0 py-0 relative text-blue-700 dark:text-blue-500
      after:block after:absolute after:top-[88%] after:left-0 after:h-[1px] after:w-full after:bg-blue-700 dark:after:bg-blue-500
      after:transition after:duration-[158ms] after:origin-[1%_50%] after:scale-x-0
      hover:after:scale-x-100 active:after:opacity-[0.6]
    `,
    disabled: `
      px-0 py-0
      bg-transparent
      text-slate-400
      dark:bg-transparent
    `,
  },
} as const;

export default function LinkButton({
  variant = 'filled',
  size = 'lg',
  className,
  disabled,
  children,
  onClick,
  ...props
}: LinkButtonProps) {
  const onClickLocal = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) return event.preventDefault();
    onClick?.(event);
  };

  const status = disabled ? 'disabled' : 'enabled';

  return (
    <Link
      {...props}
      aria-disabled={disabled}
      onClick={onClickLocal}
      className={twMerge(
        clsx(
          'no-underline transition duration-300',
          ButtonClassNames.common,
          ButtonClassNames.size[size],
          LinkButtonClassNames.common[status],
          LinkButtonClassNames[variant][status],
          className,
        ),
      )}
    >
      {children}
    </Link>
  );
}
