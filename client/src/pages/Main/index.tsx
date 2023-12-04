import { Blockquote, Button, Code, Container, Group, Mark, Paper, Text, Title } from '@mantine/core';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';

export default function MainPage() {
  useDocumentTitle('Главная');

  return (
    <Container>
      <Paper withBorder p="md" mb="md">
        <Group>
          <Button
            onClick={() => {
              // todo: persist store
              localStorage.setItem('mantine-scale', '1');
              document.documentElement.dataset.mantineScale = '1';
            }}
          >
            Scale 1
          </Button>
          <Button
            onClick={() => {
              localStorage.setItem('mantine-scale', '1.5');
              document.documentElement.dataset.mantineScale = '1.5';
            }}
          >
            Scale 1.5
          </Button>
          <Button
            onClick={() => {
              localStorage.setItem('mantine-scale', '2');
              document.documentElement.dataset.mantineScale = '2';
            }}
          >
            Scale 2
          </Button>
        </Group>
      </Paper>
      <Paper withBorder p="md" mb="md">
        <Title>Главная</Title>
        <Title order={2}>Главная</Title>
        <Title order={3}>Главная</Title>
        <Title order={4}>Главная</Title>
        <Title order={5}>Главная</Title>
        <Title order={6}>Главная</Title>
      </Paper>
      <Paper withBorder p="md" mb="md">
        <Text>
          Широкая электрификация<Mark> южных губерний даст </Mark>мощный толчок подъёму сельского хозяйства
        </Text>
      </Paper>
      <Paper withBorder p="md" mb="md">
        <Code>Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства</Code>
      </Paper>
      <Paper withBorder p="md" mb="md">
        <Blockquote color="blue" cite="– Я">
          Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства
        </Blockquote>
      </Paper>
      <Paper withBorder p="md" mb="md">
        <Title>Главная</Title>
        <Title order={2}>Главная</Title>
        <Title order={3}>Главная</Title>
        <Title order={4}>Главная</Title>
        <Title order={5}>Главная</Title>
        <Title order={6}>Главная</Title>
      </Paper>
      <Paper withBorder p="md" mb="md">
        <Text>Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства</Text>
      </Paper>
      <Paper withBorder p="md" mb="md">
        <Code>Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства</Code>
      </Paper>
      <Paper withBorder p="md" mb="md">
        <Blockquote color="blue" cite="– Я">
          Широкая электрификация южных губерний даст мощный толчок подъёму сельского хозяйства
        </Blockquote>
      </Paper>
    </Container>
  );
}
