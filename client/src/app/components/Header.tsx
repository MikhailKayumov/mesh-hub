import ThemeButton from '~/app/components/ThemeButton';
import LinkButton from '~/components/LinkButton';
import Api from '~/api/Api';

export default async function Header() {
  const currentUser = await Api.user.current();

  return (
    <header className="top-0 z-50 col-span-2 flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-600 dark:bg-slate-950">
      <div className="m-0 font-mono text-3xl font-bold tracking-wide text-blue-950 dark:text-blue-50">MeshHub</div>
      <div className="-mr-2 flex h-full items-center gap-4">
        <ThemeButton />
        {currentUser ? (
          currentUser.firstName
        ) : (
          <div className="flex h-full items-center gap-1">
            <LinkButton href="login" title="Войти" />
            <LinkButton href="login" title="Регистрация" variant="text" />
          </div>
        )}
      </div>
    </header>
  );
}
