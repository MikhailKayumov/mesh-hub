import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import zod from 'zod';
import { useLoginMutation } from '@/api/auth.ts';
import { LoginRequestDto } from '@/api/dto.ts';
import { isValidationException } from '@/api/utils.ts';
import { ValidationErrorMessages } from '@/constants';
import RouterPaths from '@/router/paths.ts';
import { userActions } from '@/store/user/reducer.ts';

const schema = zod.object({
  email: zod.string().trim().email(ValidationErrorMessages.Email).min(1, ValidationErrorMessages.RequiredField),
  password: zod
    .string()
    .trim()
    .min(6, ValidationErrorMessages.PasswordLength)
    .min(1, ValidationErrorMessages.RequiredField),
});

export default function useLoginForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [apiLogin] = useLoginMutation();

  const form = useForm<LoginRequestDto>({
    validate: zodResolver(schema),
    initialValues: {
      email: import.meta.env.VITE_APP_TEST_USER_EMAIL ?? '',
      password: import.meta.env.VITE_APP_TEST_USER_PASSWORD ?? '',
    },
    transformValues: (values) => ({ email: values.email.trim(), password: values.password.trim() }),
  });

  return {
    form,
    isSubmitting,
    onSubmit: form.onSubmit(async (data) => {
      try {
        submitStart();

        const session = await apiLogin(data).unwrap();

        dispatch(userActions.setSession(session));
        navigate(RouterPaths.Base, { replace: true });
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
