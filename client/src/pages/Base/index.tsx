import { Outlet } from 'react-router-dom';
import { BaseLayout } from '@/widget/layouts';

export function BasePage() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
