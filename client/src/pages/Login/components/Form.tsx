import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/Input';
import Button from '@/components/Button';
import LinkButton from '@/components/LinkButton';
import RouterPaths from '@/router/paths';
import { useLoginMutation } from '@/api/auth.ts';
import { LoginRequestDto } from '@/api/dto.ts';
import { isValidationException } from '@/api/utils.ts';

export default function Form() {
  const navigate = useNavigate();
  const [apiLogin] = useLoginMutation();

  const form = useForm<LoginRequestDto>({
    defaultValues: {
      email: import.meta.env.VITE_APP_TEST_USER_EMAIL ?? '',
      password: import.meta.env.VITE_APP_TEST_USER_PASSWORD ?? '',
    },
  });
  const { errors, defaultValues } = form.formState;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await apiLogin(data).unwrap();
      navigate(RouterPaths.Base, { replace: true });
    } catch (e) {
      if (isValidationException<keyof LoginRequestDto>(e)) {
        e.data.forEach((i) => {
          form.setError(i.property, { message: i.errors.join('. ') });
        });
      } else {
        console.log('[LoginFormSubmitError]: >>', e);
      }
    }
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
        <LinkButton to={`/${RouterPaths.Login}`} title="Зарегистрироваться?" variant="text" />
      </div>
    </form>
  );
}
