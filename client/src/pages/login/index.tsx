import Form from './components/Form';

export default function LoginPage() {
  return (
    <section className="flex h-full w-full items-center justify-center">
      <div className="max-w-sm rounded-md border border-slate-200 px-12 py-14 dark:border-slate-600 sm:max-w-[400px]">
        <h2 className="mb-4 mt-0">Вход</h2>
        <p className="mb-6 text-sm">Введите Ваши адрес электронной почты и пароль</p>
        <Form />
      </div>
    </section>
  );
}
