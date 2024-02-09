import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '@/api/auth.ts';
import { SignupRequestDto } from '@/api/dto.ts';
import { RouterPaths } from '@/router/paths.ts';
import { userActions } from '@/store/user/reducer.ts';
import { processFormSubmitError } from '@/utils/processFormSubmitError.ts';
import { validationSchema, initialValues, transformValues } from './constants.ts';

export function useRegisterForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [register] = useRegisterMutation();

  const form = useForm<SignupRequestDto>({
    validate: zodResolver(validationSchema),
    initialValues,
    transformValues,
  });

  return {
    form,
    isSubmitting,
    onSubmit: form.onSubmit(async (data) => {
      try {
        submitStart();

        const session = await register(data).unwrap();

        dispatch(userActions.setSession(session.id));
        navigate(RouterPaths.Base, { replace: true });

        notifications.show({ message: 'Регистрация успешно завершена', color: 'green', autoClose: 3000 });
      } catch (e) {
        processFormSubmitError<SignupRequestDto>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
