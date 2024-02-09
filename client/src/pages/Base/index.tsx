import { Outlet } from 'react-router-dom';
import { BaseLayout } from '@/layouts/Base';

export function BasePage() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
