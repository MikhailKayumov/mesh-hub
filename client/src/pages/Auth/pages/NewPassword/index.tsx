import { PasswordInput, Button, Title, Group, Anchor, rem, Box, Center } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import useNewPasswordForm from './useNewPasswordForm.ts';

export default function NewPasswordPage() {
  useDocumentTitle('Новый пароль');

  const { form, isSubmitting, onSubmit } = useNewPasswordForm();

  return (
    <>
      <Title mb={24}>Новый пароль</Title>
      <form onSubmit={onSubmit}>
        <PasswordInput
          label="Пароль"
          placeholder="Введите пароль"
          withAsterisk
          {...form.getInputProps('password')}
          mb={16}
        />
        <PasswordInput
          label="Подтвержение пароля"
          placeholder="Введите пароль еще раз"
          withAsterisk
          {...form.getInputProps('confirmPassword')}
        />
        <Group align="center" justify="space-between" mt={24}>
          <Anchor c="dimmed" component={Link} to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Login])} replace>
            <Center inline>
              <IconArrowLeft style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
              <Box ml={6} fz={14}>
                Назад
              </Box>
            </Center>
          </Anchor>
          <Button type="submit" ml="auto" loading={isSubmitting}>
            Сохранить
          </Button>
        </Group>
      </form>
    </>
  );
}
