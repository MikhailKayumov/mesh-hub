import { Outlet } from 'react-router-dom';
import BaseLayout from '../layouts/Base';
import { useCurrentUserQuery } from '../api/user';

export default function BasePage() {
  const { data, isLoading } = useCurrentUserQuery();
  // console.log(data);

  if (isLoading) {
    return null;
  }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
