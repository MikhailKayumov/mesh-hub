import { type ReactNode, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { type RouterPath, RouterPaths } from '@/shared/router/paths.ts';
import { BadRequestError, ForbiddenError, NotFoundError, ServiceUnavailableError } from '@/widgets/Errors';
import { BaseLayout } from '@/widgets/layouts';

export function ErrorPage() {
  const { code } = useParams<{ code: RouterPath }>();

  const content = useMemo<ReactNode>(() => {
    switch (code) {
      case RouterPaths.BadRequest:
        return <BadRequestError />;
      case RouterPaths.Forbidden:
        return <ForbiddenError />;
      case RouterPaths.ServiceUnavailable:
        return <ServiceUnavailableError />;
    }

    return <NotFoundError />;
  }, []);

  return <BaseLayout>{content}</BaseLayout>;
}
