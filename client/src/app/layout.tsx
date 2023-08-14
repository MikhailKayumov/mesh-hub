import './global.css';
import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import styles from './RootLayout.module.css';

export const metadata: Metadata = {
  title: 'MeshHub',
  description: 'MeshHub is 3D models market for 3D artists',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='ru' data-mode='dark'>
      <body>
        <header className={styles.header}>
          <h2 className='m-0 font-headings'>MeshHub</h2>
        </header>
        {children}
      </body>
    </html>
  );
}
