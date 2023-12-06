import { Modal, Button, Group, PasswordInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import useChangePasswordForm from './useChangePasswordForm.ts';

export default function ChangePasswordModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const { form, isSubmitting, onSubmit } = useChangePasswordForm();

  return (
    <>
      <Button variant="transparent" onClick={open}>
        Изменить пароль
      </Button>
      <Modal
        centered
        opened={opened}
        onClose={close}
        title="Изменение пароля"
        size="sm"
        padding="lg"
        closeButtonProps={{ 'aria-label': 'Close modal' }}
      >
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            onSubmit(e);
          }}
        >
          <PasswordInput
            label="Текущий пароль"
            placeholder="Введите текущий пароль"
            withAsterisk
            {...form.getInputProps('oldPassword')}
            mb={16}
          />
          <PasswordInput
            label="Новый пароль"
            placeholder="Введите новый пароль"
            withAsterisk
            {...form.getInputProps('password')}
            mb={16}
          />
          <PasswordInput
            label="Подтвержение нового пароля"
            placeholder="Введите новый пароль еще раз"
            withAsterisk
            {...form.getInputProps('confirmPassword')}
          />
          <Group align="center" justify="space-between" wrap="nowrap" mt={24}>
            <Button disabled={isSubmitting} fullWidth variant="outline" onClick={close}>
              Отмена
            </Button>
            <Button type="submit" loading={isSubmitting} fullWidth>
              Сохранить
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
