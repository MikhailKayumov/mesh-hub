import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import zod from 'zod';
import { useResetPasswordMutation } from '@/api/user.ts';
import { isValidationException } from '@/api/utils.ts';
import { ValidationErrorMessages } from '@/constants';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';

const schema = zod.object({
  email: zod.string().trim().email(ValidationErrorMessages.Email).min(1, ValidationErrorMessages.RequiredField),
});

export default function useResetPasswordForm() {
  const navigate = useNavigate();
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [resetPassword, { isSuccess }] = useResetPasswordMutation();

  const form = useForm<{ email: string }>({
    initialValues: {
      email: import.meta.env.VITE_APP_TEST_USER_EMAIL ?? '',
    },
    validate: zodResolver(schema),
    transformValues: (values) => ({ email: values.email.trim() }),
  });

  return {
    form,
    isSubmitting,
    isSuccess,
    onSubmit: form.onSubmit(async ({ email }) => {
      if (isSuccess) {
        return navigate(buildAbsolutePath([RouterPaths.Auth, RouterPaths.Login]));
      }

      try {
        submitStart();
        await resetPassword(email).unwrap();
      } catch (e) {
        if (isValidationException<keyof { email: string }>(e)) {
          e.data.forEach((i) => form.setFieldError(i.property, i.errors.join('. ')));
        } else {
          notifications.show({
            title: 'Ошибка',
            message: (e as any).message ?? 'Неизвестная ошибка',
            color: 'red',
            autoClose: 10000,
          });
        }
      } finally {
        submitEnd();
      }
    }),
  };
}
