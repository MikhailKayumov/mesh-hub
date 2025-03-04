import { useWindowScroll } from '@mantine/hooks';
import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '@/entities/user/hooks/useSession';
import { RouterPaths } from '@/shared/router/paths.ts';
import { UserLayout } from '@/widgets/layouts';

export function UserPage() {
  const navigate = useNavigate();
  const session = useSession();

  const [, scrollTo] = useWindowScroll();
  useEffect(() => scrollTo({ y: 0 }), []);

  useLayoutEffect(() => {
    if (!session) navigate(RouterPaths.Base);
  }, [navigate, session]);

  return (
    <UserLayout>
      <Outlet />
    </UserLayout>
  );
}
