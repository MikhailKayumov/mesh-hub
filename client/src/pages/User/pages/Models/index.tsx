import { Title } from '@mantine/core';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';

export default function ModelsPage() {
  useDocumentTitle('Настройки');

  return (
    <>
      <Title mb="lg">Модели</Title>
    </>
  );
}
