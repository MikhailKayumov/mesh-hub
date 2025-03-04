import { ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import { isRouteNotFoundErrorResponse } from '@/shared/utils/type-guards.ts';
import { NotFoundError } from '@/widgets/Errors';
import { BaseLayout } from '@/widgets/layouts';

export function BaseErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  let content: ReactNode = '';
  if (isRouteNotFoundErrorResponse(error)) {
    content = <NotFoundError />;
  }

  return <BaseLayout>{content}</BaseLayout>;
}
