import { Paper, Title } from '@mantine/core';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import ColorThemeSwitcher from './components/ColorThemeSwitcher';
import SessionTable from './components/SessionTable';

export default function SettingsPage() {
  useDocumentTitle('Настройки');

  return (
    <>
      <Title mb="lg">Настройки</Title>
      <Paper withBorder p={24}>
        <Title order={4} fw={400} mb="sm">
          Цветовая тема
        </Title>
        <ColorThemeSwitcher />
        <SessionTable />
      </Paper>
    </>
  );
}
