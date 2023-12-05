import { ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import { NotFoundError } from '@/components/Errors';
import BaseLayout from '@/layouts/Base';
import { isRouteNotFoundErrorResponse } from '@/utils/type-guards.ts';

export default function BaseErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  let content: ReactNode = '';
  if (isRouteNotFoundErrorResponse(error)) {
    content = <NotFoundError />;
  }

  return <BaseLayout>{content}</BaseLayout>;
}
