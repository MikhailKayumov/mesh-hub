import { TextInput, Button, Title, Group, Anchor, rem, Box, Center, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import useResetPasswordForm from './useResetPasswordForm.ts';

export default function ResetPasswordPage() {
  useDocumentTitle('Не помните пароль?');

  const { form, isSubmitting, isSuccess, onSubmit } = useResetPasswordForm();

  return (
    <>
      <Title mb={24}>Сброс пароля</Title>
      <form onSubmit={onSubmit}>
        {isSuccess ? (
          <Text>Вам на почту отправлено письмо со ссылкой на страницу создания нового пароля</Text>
        ) : (
          <TextInput
            label="Email"
            size="md"
            placeholder="your@email.ru"
            withAsterisk
            {...form.getInputProps('email')}
            mb={12}
          />
        )}
        <Group align="center" justify="space-between" mt={32}>
          {!isSuccess && (
            <Anchor c="dimmed" component={Link} size="md" to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Login])}>
              <Center inline>
                <IconArrowLeft style={{ width: rem(15), height: rem(15) }} stroke={2} />
                <Box ml={6}>Назад</Box>
              </Center>
            </Anchor>
          )}
          <Button type="submit" size="md" ml="auto" loading={isSubmitting}>
            {isSuccess ? 'Понятно' : 'Сбросить пароль'}
          </Button>
        </Group>
      </form>
    </>
  );
}
