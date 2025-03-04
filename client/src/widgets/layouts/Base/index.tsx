import { AppShell } from '@mantine/core';
import { PropsWithChildren } from 'react';
import { useCurrentColorScheme } from '@/shared/hooks/useCurrentColorScheme.ts';
import { Footer } from '@/widgets/Footer';
import { Header } from '@/widgets/Header';

export function BaseLayout({ children }: PropsWithChildren) {
  const { isLight } = useCurrentColorScheme();

  return (
    <AppShell
      h="100%" //
      padding="md"
      header={{ height: 60 }}
    >
      <AppShell.Header withBorder className="main-page-header">
        <Header />
      </AppShell.Header>
      <AppShell.Main className="main-page-content" bg={isLight ? 'gray.0' : undefined}>
        {children}
      </AppShell.Main>
      <AppShell.Footer className="main-page-footer" py="xl">
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
