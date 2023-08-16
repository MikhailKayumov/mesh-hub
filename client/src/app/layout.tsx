import './global.css';
import { PropsWithChildren } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MeshHub',
  description: 'MeshHub is 3D models market for 3D artists',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='ru' dir='ltr' data-mode='dark'>
      <body>
        <header className='flex justify-between p-4 dark:border-slate-700 dark:border-b'>
          <h2 className='m-0 font-headings'>MeshHub</h2>
        </header>
        {children}
      </body>
    </html>
  );
}
