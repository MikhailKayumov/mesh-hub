import { Container, Title } from '@mantine/core';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';

export default function MainPage() {
  useDocumentTitle('Главная');

  return (
    <Container>
      <Title>Главная</Title>
    </Container>
  );
}
