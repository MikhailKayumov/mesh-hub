import { Outlet } from 'react-router-dom';
import BaseLayout from '@/layouts/Base';

export default function BasePage() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
