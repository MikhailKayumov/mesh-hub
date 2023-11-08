import { clsx } from 'clsx';
import { Link, LinkProps } from 'react-router-dom';
import { ButtonVariant, ButtonSize, ButtonClassNames } from '../Button';

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  className?: string;
  disabled?: boolean;
}

export const LinkButtonClassNames = {
  filled: {
    enabled:
      'bg-blue-700 text-white hover:bg-blue-600 active:bg-blue-800 hover:shadow-md hover:shadow-blue-800/30 active:shadow active:shadow-blue-800/30',
    disabled: 'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-600',
  },
  outlined: {
    enabled:
      'text-blue-700 border border-blue-700 hover:border-blue-600 active:border-blue-800 hover:text-blue-600 active:text-blue-800 hover:shadow-md hover:shadow-blue-800/30 active:shadow active:shadow-blue-800/30',
    disabled:
      'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-600',
  },
  text: {
    enabled: 'text-blue-700 hover:text-blue-600 active:text-blue-800 hover:bg-blue-600/10 active:bg-blue-800/10',
    disabled: 'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-600',
  },
} as const;

export default function LinkButton({
  variant = 'filled',
  size = 'lg',
  title,
  className,
  disabled,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      {...props}
      className={clsx(
        'no-underline',
        ButtonClassNames.common,
        LinkButtonClassNames[variant][disabled ? 'disabled' : 'enabled'],
        ButtonClassNames.size[size],
        className,
      )}>
      {title}
    </Link>
  );
}
