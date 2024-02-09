import { Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';

export function Models3DPage() {
  return (
    <Container display="flex" style={{ flex: 1, flexDirection: 'column' }}>
      <Outlet />
    </Container>
  );
}
