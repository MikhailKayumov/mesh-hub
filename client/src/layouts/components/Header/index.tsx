import { Link } from 'react-router-dom';
import LinkButton from '@/components/LinkButton';
import { useCurrentUserQuery } from '@/api/user.ts';
import userService from '@/services/user';
import RouterPaths from '@/router/paths.ts';
import ThemeSwitcher from '../ThemeSwitcher';

export default function Header() {
  const { data } = useCurrentUserQuery();

  return (
    <header className="top-0 z-50 col-span-2 flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-600 dark:bg-slate-950">
      <div className="m-0">
        <Link
          to={RouterPaths.Base}
          className="no-underline font-mono text-3xl font-bold tracking-wide text-blue-950 dark:text-blue-50"
        >
          MeshHub
        </Link>
      </div>
      <div className="flex h-full items-center gap-4">
        <ThemeSwitcher />
        {data ? (
          <div className="flex items-center">
            {/* Avatar */}
            <div className="w-[40px] h-[40px] shadow-md bg-slate-800 flex items-center justify-center rounded-[20px] bg-gradient-to-br from-indigo-700 from-8% via-blue-900 via-30% to-indigo-600 to-90%">
              <p className="text-white p-0 m-0 font-medium text-sm tracking-wider">{userService.getInitials(data)}</p>
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
