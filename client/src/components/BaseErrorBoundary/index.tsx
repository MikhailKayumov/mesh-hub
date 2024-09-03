import { ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import { NotFoundError } from '@/components/Errors';
import { isRouteNotFoundErrorResponse } from '@/shared/utils/type-guards.ts';
import { BaseLayout } from '@/widget/layouts';

export function BaseErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  let content: ReactNode = '';
  if (isRouteNotFoundErrorResponse(error)) {
    content = <NotFoundError />;
  }

  return <BaseLayout>{content}</BaseLayout>;
}
