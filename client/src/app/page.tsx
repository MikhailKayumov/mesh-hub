import { redirect } from 'next/navigation';
import { Routes } from '~/api/routes';
import apiUser from '~/api/user';
import Debug from '~/components/Debug';

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const result = await apiUser.current();
  // if (!result) redirect(Routes.Login);

  return (
    <div
      style={{
        background: 'white',
      }}
    >
      <Debug />
    </div>
  );
}
