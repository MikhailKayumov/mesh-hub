import { Paper, Title } from '@mantine/core';

export function DevSandbox() {
  return (
    <>
      <Title mb="lg">Development Sandbox</Title>
      <Paper withBorder p={24} style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
        123
      </Paper>
    </>
  );
}
