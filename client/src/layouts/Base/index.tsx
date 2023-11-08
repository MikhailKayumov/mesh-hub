import { PropsWithChildren } from 'react';
import Header from '../components/Header';

export interface BaseLayoutProps extends PropsWithChildren {}

export default function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <>
      <Header />
      <main className="w-full flex">{children}</main>
    </>
  );
}
