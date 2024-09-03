import { Paper, Title } from '@mantine/core';
import { ColorThemeSwitcher } from '@/components/ColorThemeSwitcher';
import { SessionTable } from '@/components/SessionTable';
import { useDocumentTitle } from '@/shared/hooks/';

export function SettingsPage() {
  useDocumentTitle('Настройки');

  return (
    <>
      <Title mb="lg">Настройки</Title>
      <Paper withBorder p={24} style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
        <Title order={4} fw={400} mb="sm">
          Цветовая тема
        </Title>
        <ColorThemeSwitcher />
        <SessionTable />
      </Paper>
    </>
  );
}
