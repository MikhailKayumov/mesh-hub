import LinkButton from '../../../components/LinkButton';
import ThemeSwitcher from '../ThemeSwitcher';

export default function Header() {
  return (
    <header className="top-0 z-50 col-span-2 flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-600 dark:bg-slate-950">
      <div className="m-0 font-mono text-3xl font-bold tracking-wide text-blue-950 dark:text-blue-50">MeshHub</div>
      <div className="-mr-2 flex h-full items-center gap-4">
        <ThemeSwitcher />
        <div className="flex h-full items-center gap-1">
          <LinkButton to="/login" title="Войти" />
          <LinkButton to="/login" title="Регистрация" variant="text" />
        </div>
      </div>
    </header>
  );
}
