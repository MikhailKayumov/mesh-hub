import { AppShell } from '@mantine/core';
import { PropsWithChildren } from 'react';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';
import Header from '@/modules/Header';

export default function BaseLayout({ children }: PropsWithChildren) {
  const { isLight } = useCurrentColorScheme();

  return (
    <AppShell h="100%" header={{ height: 60 }} padding="md">
      <AppShell.Header withBorder>
        <Header />
      </AppShell.Header>
      <AppShell.Main px={0} className="main-page-content" bg={isLight ? 'gray.0' : undefined}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
