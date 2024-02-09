import { Text, Title } from '@mantine/core';

export interface ErrorTitleProps {
  text: string;
  status: number;
}

export function ErrorTitle({ text, status }: ErrorTitleProps) {
  return (
    <Title fz={40} fw={400} style={{ whiteSpace: 'nowrap' }}>
      {text}{' '}
      <Text component="sup" c="dimmed" fz={24}>
        {status}
      </Text>
    </Title>
  );
}
