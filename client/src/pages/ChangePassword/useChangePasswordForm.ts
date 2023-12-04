import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import zod from 'zod';
import { LoginRequestDto, UserChangePasswordRequestDto } from '@/api/dto.ts';
import { useChangePasswordMutation } from '@/api/user.ts';
import { isValidationException } from '@/api/utils.ts';
import { AppRegexp, ValidationErrorMessages } from '@/constants';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';

type FormData = Omit<UserChangePasswordRequestDto, 'requestId'>;

const schema = zod
  .object({
    password: zod
      .string()
      .trim()
      .regex(AppRegexp.Password, ValidationErrorMessages.PasswordContent)
      .min(6, ValidationErrorMessages.PasswordLength)
      .min(1, ValidationErrorMessages.RequiredField),
    confirmPassword: zod.string().trim().min(1, ValidationErrorMessages.RequiredField),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export default function useChangePasswordForm() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestId = searchParams.get('request');
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [changePassword] = useChangePasswordMutation();

  const form = useForm<FormData>({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: zodResolver(schema),
    transformValues: (values) => ({
      password: values.password.trim(),
      confirmPassword: values.confirmPassword.trim(),
    }),
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
        notifications.show({ message: 'Пароль успешно изменен', color: 'green', autoClose: 3000 });
        setSearchParams({});
      } catch (e) {
        if (isValidationException<keyof LoginRequestDto>(e)) {
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
