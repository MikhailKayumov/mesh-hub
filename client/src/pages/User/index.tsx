import { useLayoutEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import useSession from '@/hooks/useSession.ts';
import UserLayout from '@/layouts/User';
import RouterPaths from '@/router/paths.ts';

export default function UserPage() {
  const navigate = useNavigate();
  const session = useSession();

  useLayoutEffect(() => {
    if (!session) navigate(RouterPaths.Base);
  }, [navigate, session]);

  return (
    <UserLayout>
      <Outlet />
    </UserLayout>
  );
}
