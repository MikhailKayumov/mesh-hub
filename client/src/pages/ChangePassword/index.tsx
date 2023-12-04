import { PasswordInput, Button, Title, Group, Anchor, rem, Box, Center } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import useChangePasswordForm from './useChangePasswordForm.ts';

export default function ChangePasswordPage() {
  useDocumentTitle('Новый пароль');

  const { form, isSubmitting, onSubmit } = useChangePasswordForm();

  return (
    <>
      <Title mb={24}>Новый пароль</Title>
      <form onSubmit={onSubmit}>
        <PasswordInput
          label="Пароль"
          placeholder="Введите пароль"
          withAsterisk
          {...form.getInputProps('password')}
          size="md"
          mb={16}
        />
        <PasswordInput
          label="Подтвержение пароля"
          placeholder="Введите пароль еще раз"
          withAsterisk
          {...form.getInputProps('confirmPassword')}
          size="md"
        />
        <Group align="center" justify="space-between" mt={32}>
          <Anchor
            c="dimmed"
            component={Link}
            size="md"
            to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Login])}
            replace
          >
            <Center inline>
              <IconArrowLeft style={{ width: rem(15), height: rem(15) }} stroke={2} />
              <Box ml={6}>Назад</Box>
            </Center>
          </Anchor>
          <Button type="submit" size="md" ml="auto" loading={isSubmitting}>
            Сохранить
          </Button>
        </Group>
      </form>
    </>
  );
}
