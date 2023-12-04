import { Flex, Paper } from '@mantine/core';
import { useLayoutEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import useSession from '@/hooks/useSession.ts';
import RouterPaths from '@/router/paths.ts';

export default function AuthPage() {
  const navigate = useNavigate();
  const session = useSession();

  useLayoutEffect(() => {
    if (session) navigate(RouterPaths.Base);
  }, [navigate, session]);

  return (
    <Flex align="center" justify="center" style={{ flex: 1 }}>
      <Paper withBorder p="xl" w={420}>
        <Outlet />
      </Paper>
    </Flex>
  );
}
