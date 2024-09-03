import { useLayoutEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '@/entities/user/hooks/useSession';
import { RouterPaths } from '@/router/paths.ts';
import { AuthLayout } from '@/widget/layouts';

export function AuthPage() {
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
