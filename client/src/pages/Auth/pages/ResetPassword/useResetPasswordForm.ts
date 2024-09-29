import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import zod from 'zod';
import { UserResetPasswordRequestDto } from '@/app/api/dto.ts';
import { useResetPasswordMutation } from '@/app/api/user.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { processFormSubmitError } from '@/shared/utils/processFormSubmitError.ts';
import { buildAbsolutePath } from '@/shared/utils/router';
import { ValidationErrorMessages } from '../../../../shared/constants';

export function useResetPasswordForm() {
  const navigate = useNavigate();
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [resetPassword, { isSuccess }] = useResetPasswordMutation();

  const form = useForm<UserResetPasswordRequestDto>({
    initialValues: { email: '' },
    validate: zodResolver(
      zod.object({
        email: zod.string().trim().email(ValidationErrorMessages.Email).min(1, ValidationErrorMessages.RequiredField),
      }),
    ),
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
        processFormSubmitError<UserResetPasswordRequestDto>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
