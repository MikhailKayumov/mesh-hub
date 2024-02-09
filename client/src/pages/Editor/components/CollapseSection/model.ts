import { PropsWithChildren } from 'react';

export interface CollapseSectionProps extends PropsWithChildren {
  title: string;
  className?: string;
  defaultOpened?: boolean;
}
