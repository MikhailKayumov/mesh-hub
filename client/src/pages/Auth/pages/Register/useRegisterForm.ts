import { useForm, schemaResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '@/app/api/auth.ts';
import type { SignupRequestDto } from '@/app/api/dto.ts';
import { userActions } from '@/entities/user/store';
import { RouterPaths } from '@/shared/router/paths.ts';
import { processFormSubmitError } from '@/shared/utils/processFormSubmitError.ts';
import { validationSchema, initialValues, transformValues } from './constants.ts';

export function useRegisterForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [register] = useRegisterMutation();

  const form = useForm<SignupRequestDto>({
    validate: schemaResolver(validationSchema, { sync: true }),
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
