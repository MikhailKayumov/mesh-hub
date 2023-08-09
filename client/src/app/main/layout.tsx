import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { MainLayout as ClientMainLayout } from '~/layouts/main';

export const metadata: Metadata = {
  title: 'MeshHub | Main',
  description: '',
};

export default function MainLayout({ children }: PropsWithChildren) {
  return <ClientMainLayout>{children}</ClientMainLayout>;
}
