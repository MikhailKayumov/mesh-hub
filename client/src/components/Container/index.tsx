import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { forwardRef, JSX, PropsWithChildren } from 'react';

export interface ContainerProps extends PropsWithChildren {
  className?: string;
  as?: keyof Pick<JSX.IntrinsicElements, 'div' | 'main' | 'section'>;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(({ className, children, as: Element = 'div' }, ref) => {
  return (
    <Element ref={ref} className={twMerge(clsx('container mx-auto', className))}>
      {children}
    </Element>
  );
});

export default Container;
