'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { LoginRequestDto } from '~/api/data-contracts';
import Input from '~/components/Input';
import Api from '~/api/Api';
import Button from '~/components/Button';
import LinkButton from '~/components/LinkButton';

export default function Form() {
  const form = useForm<LoginRequestDto>({
    defaultValues: {
      email: process.env.NEXT_PUBLIC_TEST_USER_EMAIL ?? '',
      password: process.env.NEXT_PUBLIC_TEST_USER_PASSWORD ?? '',
    },
  });
  const { errors, defaultValues } = form.formState;
  const router = useRouter();

  const onSubmit = form.handleSubmit(async data => {
    const res = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    router.push('/');
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <div className="flex flex-col gap-6">
        <Input
          {...form.register('email', {
            required: {
              value: true,
              message: 'Обязательное поле',
            },
            pattern: {
              value: /^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: 'Не корректный электронный адрес',
            },
          })}
          defaultValue={defaultValues?.password}
          placeholder="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
        />
        <Input
          {...form.register('password', {
            required: {
              value: true,
              message: 'Обязательное поле',
            },
            pattern: {
              value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).*$/,
              message: 'В пароле должны присутствовать: число, большая буква, маленькая буква',
            },
          })}
          defaultValue={defaultValues?.password}
          placeholder="Пароль"
          type="password"
          autoComplete="off"
          error={errors.password}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={onSubmit}>
          Войти
        </Button>
        <LinkButton href="login" title="Зарегистрироваться?" variant="text" />
      </div>
    </form>
  );
}
