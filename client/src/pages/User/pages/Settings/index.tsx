import { Paper, Title } from '@mantine/core';
import { useDocumentTitle } from '@/shared/hooks/';
import { ColorThemeSwitcher } from '../../../../widgets/ColorThemeSwitcher';
import { SessionTable } from '../../../../widgets/SessionTable';

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
