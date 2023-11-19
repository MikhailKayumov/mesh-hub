import { JSX, PropsWithChildren } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export type TypographyVariant = keyof Pick<JSX.IntrinsicElements, 'h1' | 'h2' | 'h3' | 'h4' | 'p'>;

export interface TypographyProp extends PropsWithChildren {
  variant?: TypographyVariant;
  className?: string;
}

export default function Typography({ variant: Variant = 'p', children, className }: TypographyProp) {
  return <Variant className={twMerge(clsx('m-0', className))}>{children}</Variant>;
}
