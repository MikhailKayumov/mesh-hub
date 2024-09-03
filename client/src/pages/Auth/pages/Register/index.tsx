import { Anchor, Title, Text, Center, Button, PasswordInput, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';
import { RouterPaths } from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import { useDocumentTitle } from '@/shared/hooks';
import { useRegisterForm } from './useRegisterForm.ts';

export function RegisterPage() {
  useDocumentTitle('Регистрация');

  const { form, isSubmitting, onSubmit } = useRegisterForm();

  return (
    <>
      <Title mb={24}>Регистрация</Title>

      <form onSubmit={onSubmit}>
        <TextInput
          label="Имя"
          placeholder="Введите ваше имя"
          withAsterisk
          {...form.getInputProps('firstName')}
          mb={16}
        />
        <TextInput label="Фамилия" placeholder="Введите вашу фамилию" {...form.getInputProps('lastName')} mb={16} />
        <TextInput label="Email" placeholder="your@email.ru" withAsterisk {...form.getInputProps('email')} mb={16} />
        <PasswordInput
          label="Пароль"
          placeholder="Введите пароль"
          withAsterisk
          {...form.getInputProps('password')}
          translate="yes"
          mb={16}
        />
        <PasswordInput
          label="Подтвержение пароля"
          placeholder="Введите пароль еще раз"
          withAsterisk
          {...form.getInputProps('confirmPassword')}
          translate="yes"
        />
        <Button fullWidth type="submit" mt={24} loading={isSubmitting}>
          Зарегистрироваться
        </Button>
      </form>

      <Center mt={12}>
        <Text size="sm" c="dimmed">
          Есть личный кабинет?{' '}
          <Anchor component={Link} to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Login])}>
            Войти
          </Anchor>
        </Text>
      </Center>
    </>
  );
}
