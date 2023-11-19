import { PropsWithChildren } from 'react';

export interface MainLayoutProps extends PropsWithChildren {}

export default function MainLayout({ children }: MainLayoutProps) {
  return <main className="flex w-full">{children}</main>;
}
