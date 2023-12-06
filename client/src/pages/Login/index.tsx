import { Anchor, Flex, Title, Text, Center, Button, PasswordInput, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import useLoginForm from '@/pages/Login/useLoginForm.ts';
import RouterPaths from '@/router/paths';
import { buildAbsolutePath } from '@/router/utils';

export default function LoginPage() {
  useDocumentTitle('Вход');

  const { form, isSubmitting, onSubmit } = useLoginForm();

  return (
    <>
      <Title mb={24}>Вход</Title>

      <form onSubmit={onSubmit}>
        <TextInput label="Email" placeholder="your@email.ru" withAsterisk {...form.getInputProps('email')} mb={16} />
        <div>
          <PasswordInput
            label="Пароль"
            placeholder="Введите пароль"
            withAsterisk
            {...form.getInputProps('password')}
            translate="yes"
          />
          <Flex justify="flex-end" mt={8}>
            <Anchor component={Link} size="sm" to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.ResetPassword])}>
              Не помните пароль?
            </Anchor>
          </Flex>
        </div>
        <Button fullWidth type="submit" mt={24} loading={isSubmitting}>
          Войти
        </Button>
      </form>

      <Center mt={12}>
        <Text size="sm" c="dimmed">
          Нет личного кабинета?{' '}
          <Anchor component={Link} to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Register])}>
            Зарегистрироваться
          </Anchor>
        </Text>
      </Center>
    </>
  );
}
