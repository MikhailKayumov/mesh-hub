import { Link } from 'react-router-dom';
import LinkButton from '@/components/LinkButton';
import { useCurrentUserQuery } from '@/api/user.ts';
import userService from '@/services/user';
import RouterPaths from '@/router/paths.ts';
import ThemeSwitcher from '../ThemeSwitcher';

export default function Header() {
  const { data } = useCurrentUserQuery();

  return (
    <header className="top-0 z-50 col-span-2 flex h-14 items-center justify-between border-b border-white bg-white px-4 shadow dark:border-slate-600 dark:bg-slate-950 dark:shadow-none">
      <div className="m-0">
        <Link
          to={RouterPaths.Base}
          className="font-mono text-3xl font-bold tracking-wide text-blue-950 no-underline dark:text-blue-50"
        >
          MeshHub
        </Link>
      </div>
      <div className="flex h-full items-center gap-4">
        <ThemeSwitcher />
        {data ? (
          <div className="flex items-center">
            {/* todo: Avatar */}
            <div className="from-8% flex h-[40px] w-[40px] items-center justify-center rounded-[20px] bg-slate-800 bg-gradient-to-br from-indigo-700 via-blue-900 via-30% to-indigo-600 to-90% shadow-md">
              <p className="m-0 p-0 text-sm font-medium tracking-wider text-white">{userService.getInitials(data)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <LinkButton to="/login" title="Войти" />
            <LinkButton to="/login" title="Регистрация" variant="text" />
          </div>
        )}
      </div>
    </header>
  );
}
