import { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { BaseLayout } from '~/layouts/base';

export const metadata: Metadata = {
  title: 'MeshHub',
  description: '',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='ru'>
      <body>
        <BaseLayout>{children}</BaseLayout>
      </body>
    </html>
  );
}
