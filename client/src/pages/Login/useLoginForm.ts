import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/api/auth.ts';
import { LoginRequestDto } from '@/api/dto.ts';
import RouterPaths from '@/router/paths.ts';
import { userActions } from '@/store/user/reducer.ts';
import processFormSubmitError from '@/utils/processFormSubmitError.ts';
import { initialValues, transformValues, validationSchema } from './constants.ts';

export default function useLoginForm() {
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
        dispatch(userActions.setSession(session));
        navigate(RouterPaths.Base, { replace: true });
      } catch (e) {
        processFormSubmitError<LoginRequestDto>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
