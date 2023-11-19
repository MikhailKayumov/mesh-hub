import { Link } from 'react-router-dom';
import LinkButton from '@/components/LinkButton';
import { useCurrentUserQuery } from '@/api/user.ts';
import userService from '@/services/user';
import RouterPaths from '@/router/paths.ts';
import Container from '@/components/Container';
import ThemeSwitcher from '@/modules/ThemeSwitcher';

export default function Header() {
  const { data } = useCurrentUserQuery();

  return (
    <header
      className="
        sticky top-0 z-50 h-[56px] shrink-0
        border-b border-white bg-white shadow
        dark:border-slate-600 dark:bg-slate-950 dark:shadow-none
      "
    >
      <Container className="flex h-full items-center justify-between">
        <div className="m-0 flex items-center gap-6">
          <Link
            to={RouterPaths.Base}
            className="
            bg-gradient-to-tl from-blue-950 to-blue-800 bg-clip-text font-mono text-3xl font-extrabold tracking-wide
            text-transparent no-underline dark:from-blue-200 dark:to-blue-50
          "
          >
            MeshHub
          </Link>
          <LinkButton size="md" variant="text" to={`/${RouterPaths.Profile}`}>
            Профиль
          </LinkButton>
          <LinkButton size="md" variant="text" to={`/${RouterPaths.Editor}`}>
            Редактор ({'α'})
          </LinkButton>
          <LinkButton size="md" variant="text" to={`/${RouterPaths.UiKit}`}>
            UI-Кит
          </LinkButton>
        </div>
        <div className="flex h-full items-center gap-4">
          <ThemeSwitcher />
          {data ? (
            <div className="flex items-center">
              {/* todo: Avatar */}
              <div className="from-8% flex h-[36px] w-[36px] items-center justify-center rounded-[20px] bg-slate-800 bg-gradient-to-br from-indigo-700 via-blue-900 via-30% to-indigo-600 to-90% shadow-md">
                <p className="m-0 p-0 text-sm font-medium tracking-wider text-white">{userService.getInitials(data)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <LinkButton to="/login" size="md">
                Войти
              </LinkButton>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
