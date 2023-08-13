import './global.css';
import { PropsWithChildren } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MeshHub',
  description: 'MeshHub is 3D models market for 3D artists',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='ru' data-mode='dark'>
      <body className='prose dark:prose-invert w-full dark:bg-slate-950 dark:text-white'>{children}</body>
    </html>
  );
}
