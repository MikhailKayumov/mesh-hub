import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUserQuery } from '@/api/user.ts';
import RouterPaths from '@/router/paths';
import Form from './components/Form';

export default function LoginPage() {
  const { data } = useCurrentUserQuery();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (data) {
      navigate(RouterPaths.Base, { replace: true });
    }
  }, [data, navigate]);

  return (
    <section className="flex h-full w-full items-center justify-center">
      <div className="max-w-sm rounded-md border border-transparent bg-white px-12 py-14 shadow dark:border-slate-600 dark:bg-slate-950 dark:shadow-none sm:max-w-[400px]">
        <h2 className="mb-4 mt-0">Вход</h2>
        <p className="mb-6 text-sm">Введите Ваши адрес электронной почты и пароль</p>
        <Form />
      </div>
    </section>
  );
}
