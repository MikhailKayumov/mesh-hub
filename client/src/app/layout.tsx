import './global.css';
import React, { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import Api from '~/api/Api';
import Header from './components/Header';

export const revalidate = 10;

export const metadata: Metadata = {
  title: 'MeshHub',
  description: 'MeshHub is 3D models market for 3D artists',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const currentUser = await Api.user.current();

  return (
    <html lang="ru" dir="ltr">
      <body className="prose grid min-h-screen w-full max-w-none grid-cols-1 grid-rows-[auto_1fr] dark:prose-invert dark:bg-slate-950 dark:text-white">
        <Header />
        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}
