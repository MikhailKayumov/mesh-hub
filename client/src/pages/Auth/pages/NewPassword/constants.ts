import zod from 'zod';
import { UserNewPasswordRequestDto } from '@/api/dto.ts';
import { AppRegexp, ValidationErrorMessages } from '@/constants';

export type UserNewPasswordFormData = Omit<UserNewPasswordRequestDto, 'requestId'>;

export const initialValues: UserNewPasswordFormData = {
  password: '',
  confirmPassword: '',
};

export const transformValues = (values: UserNewPasswordFormData) => ({
  password: values.password.trim(),
  confirmPassword: values.confirmPassword.trim(),
});

export const validationSchema = zod
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
