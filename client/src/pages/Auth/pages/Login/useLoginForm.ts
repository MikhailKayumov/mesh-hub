import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/app/api/auth.ts';
import { LoginRequestDto } from '@/app/api/dto.ts';
import { userActions } from '@/entities/user/store';
import { RouterPaths } from '@/shared/router/paths.ts';
import { processFormSubmitError } from '@/shared/utils/processFormSubmitError.ts';
import { initialValues, transformValues, validationSchema } from './constants.ts';

export function useLoginForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [apiLogin] = useLoginMutation();

  const form = useForm<LoginRequestDto>({
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

        const session = await apiLogin(data).unwrap();
        dispatch(userActions.setSession(session.id));
        navigate(RouterPaths.Base, { replace: true });
      } catch (e) {
        processFormSubmitError<LoginRequestDto>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
