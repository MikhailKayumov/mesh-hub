import { Paper, Title } from '@mantine/core';
import ColorThemeSwitcher from '@/components/ColorThemeSwitcher';
import SessionTable from '@/components/SessionTable';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';

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
