import { useLayoutEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import useSession from '@/hooks/useSession.ts';
import AuthLayout from '@/layouts/Auth';
import RouterPaths from '@/router/paths.ts';

export default function AuthPage() {
  const navigate = useNavigate();
  const session = useSession();

  useLayoutEffect(() => {
    if (session) navigate(RouterPaths.Base);
  }, [navigate, session]);

  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
