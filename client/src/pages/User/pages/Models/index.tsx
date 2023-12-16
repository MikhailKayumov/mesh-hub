import { Button, Group, Title } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';

export default function ModelsPage() {
  useDocumentTitle('Настройки');

  return (
    <>
      <Group mb="lg" justify="space-between">
        <Title>Модели</Title>
        <Button leftSection={<IconUpload size={18} />}>Загрузить модель</Button>
      </Group>
    </>
  );
}
