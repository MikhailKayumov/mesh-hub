import { Outlet } from 'react-router-dom';
import { BaseLayout } from '@/widgets/layouts';

export function BasePage() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
