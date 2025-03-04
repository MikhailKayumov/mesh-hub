import { Flex, Paper } from '@mantine/core';
import { PropsWithChildren } from 'react';

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <Flex align="center" justify="center" style={{ flex: 1 }}>
      <Paper withBorder p="xl" w={460}>
        {children}
      </Paper>
    </Flex>
  );
}
