import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNewPasswordMutation } from '@/api/user.ts';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';
import processFormSubmitError from '@/utils/processFormSubmitError.ts';
import { initialValues, transformValues, UserNewPasswordFormData, validationSchema } from './constants.ts';

export default function useNewPasswordForm() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestId = searchParams.get('request');
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [changePassword] = useNewPasswordMutation();

  const form = useForm<UserNewPasswordFormData>({
    initialValues,
    validate: zodResolver(validationSchema),
    transformValues,
  });

  useLayoutEffect(() => {
    if (!requestId) {
      navigate(buildAbsolutePath([RouterPaths.Auth, RouterPaths.Login]), { replace: true });
    }
  }, [navigate, requestId]);

  return {
    form,
    isSubmitting,
    onSubmit: form.onSubmit(async ({ password, confirmPassword }) => {
      if (!requestId) return;

      try {
        submitStart();

        await changePassword({ password, confirmPassword, requestId }).unwrap();
        setSearchParams({});

        notifications.show({ message: 'Пароль успешно изменен', color: 'green', autoClose: 3000 });
      } catch (e) {
        processFormSubmitError<UserNewPasswordFormData>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
