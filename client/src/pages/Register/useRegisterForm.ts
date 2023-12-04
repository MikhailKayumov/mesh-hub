import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import zod from 'zod';
import { useRegisterMutation } from '@/api/auth.ts';
import { UserCreateRequestDto } from '@/api/dto.ts';
import { isValidationException } from '@/api/utils.ts';
import { AppRegexp, ValidationErrorMessages } from '@/constants';
import RouterPaths from '@/router/paths.ts';
import { userActions } from '@/store/user/reducer.ts';

const schema = zod
  .object({
    firstName: zod.string().trim().min(1, ValidationErrorMessages.RequiredField),
    lastName: zod.string().trim(),
    email: zod.string().trim().email(ValidationErrorMessages.Email).min(1, ValidationErrorMessages.RequiredField),
    password: zod
      .string()
      .trim()
      .regex(AppRegexp.Password, ValidationErrorMessages.PasswordContent)
      .min(6, ValidationErrorMessages.PasswordLength)
      .min(1, ValidationErrorMessages.RequiredField),
    confirmPassword: zod
      .string()
      .trim()
      .regex(AppRegexp.Password, ValidationErrorMessages.PasswordContent)
      .min(6, ValidationErrorMessages.PasswordLength)
      .min(1, ValidationErrorMessages.RequiredField),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export default function useRegisterForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [register] = useRegisterMutation();

  const form = useForm<UserCreateRequestDto>({
    validate: zodResolver(schema),
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    transformValues: (values) => ({
      firstName: values.firstName.trim(),
      lastName: values.lastName?.trim() ?? '',
      email: values.email.trim(),
      password: values.password.trim(),
      confirmPassword: values.confirmPassword.trim(),
    }),
  });

  return {
    form,
    isSubmitting,
    onSubmit: form.onSubmit(async (data) => {
      try {
        submitStart();

        const session = await register(data).unwrap();

        dispatch(userActions.setSession(session));
        navigate(RouterPaths.Base, { replace: true });

        notifications.show({ message: 'Регистрация успешно завершена', color: 'green', autoClose: 3000 });
      } catch (e) {
        if (isValidationException<keyof UserCreateRequestDto>(e)) {
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
