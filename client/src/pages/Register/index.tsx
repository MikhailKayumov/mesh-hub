import { Anchor, Title, Text, Center, Button, PasswordInput, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import RouterPaths from '@/router/paths';
import { buildAbsolutePath } from '@/router/utils';
import useRegisterForm from './useRegisterForm.ts';

export default function RegisterPage() {
  useDocumentTitle('Регистрация');

  const { form, isSubmitting, onSubmit } = useRegisterForm();

  return (
    <>
      <Title mb={24}>Регистрация</Title>

      <form onSubmit={onSubmit}>
        <TextInput
          size="md"
          label="Имя"
          placeholder="Введите ваше имя"
          withAsterisk
          {...form.getInputProps('firstName')}
          mb={16}
        />
        <TextInput
          size="md"
          label="Фамилия"
          placeholder="Введите вашу фамилию"
          {...form.getInputProps('lastName')}
          mb={16}
        />
        <TextInput
          size="md"
          label="Email"
          placeholder="your@email.ru"
          withAsterisk
          {...form.getInputProps('email')}
          mb={16}
        />
        <PasswordInput
          label="Пароль"
          placeholder="Введите пароль"
          withAsterisk
          {...form.getInputProps('password')}
          translate="yes"
          size="md"
          mb={16}
        />
        <PasswordInput
          label="Подтвержение пароля"
          placeholder="Введите пароль еще раз"
          withAsterisk
          {...form.getInputProps('confirmPassword')}
          translate="yes"
          size="md"
        />
        <Button fullWidth type="submit" size="md" mt={32} loading={isSubmitting}>
          Зарегистрироваться
        </Button>
      </form>

      <Center mt={16}>
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
