import { useForm, schemaResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { UserChangePasswordRequestDto } from '@/app/api/dto.ts';
import { useChangePasswordMutation } from '@/app/api/user.ts';
import { processFormSubmitError } from '@/shared/utils/processFormSubmitError.ts';
import { initialValues, transformValues, validationSchema } from './constants.ts';

export function useChangePasswordForm(onSuccess: () => void) {
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [changePassword] = useChangePasswordMutation();

  const form = useForm<UserChangePasswordRequestDto>({
    initialValues,
    validate: schemaResolver(validationSchema, { sync: true }),
    transformValues,
  });

  return {
    form,
    isSubmitting,
    onSubmit: form.onSubmit(async (data) => {
      try {
        submitStart();
        await changePassword(data).unwrap();
        notifications.show({ message: 'Пароль успешно изменен', color: 'green', autoClose: 3000 });
        onSuccess();
      } catch (e) {
        processFormSubmitError<UserChangePasswordRequestDto>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
