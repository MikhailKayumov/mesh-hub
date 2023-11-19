import { resolvePath, useLocation, useOutlet } from 'react-router-dom';
import { useMemo } from 'react';
import { clsx } from 'clsx';
import LinkButton from '@/components/LinkButton';
import RouterPaths from '@/router/paths.ts';
import Container from '@/components/Container';
import Typography from '@/components/Typography';

export const NavBarTitles = {
  [RouterPaths.UiKitButtons]: 'Кнопки',
  [RouterPaths.UiKitTypography]: 'Типография',
} as const;

export function UiKitNavBar() {
  const { pathname } = useLocation();

  const buttons = useMemo<{ title: string; to: string; isActive: boolean }[]>(() => {
    const paths = [RouterPaths.UiKitButtons, RouterPaths.UiKitTypography];

    return paths.map((path) => {
      const to = resolvePath(path, `/${RouterPaths.UiKit}`);

      return {
        title: NavBarTitles[path],
        to: to.pathname,
        isActive: to.pathname === pathname,
      };
    });
  }, [pathname]);

  return (
    <div>
      <div className="sticky top-20 flex w-[180px] flex-col items-start gap-2">
        {buttons.map(({ to, isActive, title }) => {
          return (
            <LinkButton key={to} to={to} variant="text" className={clsx(isActive && 'after:scale-x-1')}>
              {title}
            </LinkButton>
          );
        })}
      </div>
    </div>
  );
}

export default function UiKitPage() {
  const outlet = useOutlet();

  return (
    <Container className="relative flex flex-1 py-4">
      <UiKitNavBar />
      <div className="h-full flex-1">
        {outlet ?? (
          <Typography variant="h1" className="col-span-2 col-start-2">
            Компоненты
          </Typography>
        )}
      </div>
    </Container>
  );
}
