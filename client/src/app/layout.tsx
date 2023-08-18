import './global.css';
import { PropsWithChildren } from 'react';
import { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'MeshHub',
  description: 'MeshHub is 3D models market for 3D artists',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ru" dir="ltr" data-mode="dark">
      <body className="prose grid min-h-screen w-full max-w-none grid-cols-1 grid-rows-[auto_1fr] dark:prose-invert dark:bg-slate-950 dark:text-white">
        <header className="top-0 col-span-2 flex justify-between p-4 dark:border-b dark:border-slate-700">
          <h2 className="m-0 font-headings">MeshHub</h2>
        </header>
        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}
