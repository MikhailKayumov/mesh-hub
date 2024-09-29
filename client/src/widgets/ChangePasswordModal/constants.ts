import zod from 'zod';
import { UserChangePasswordRequestDto } from '@/app/api/dto.ts';
import { AppRegexp, ValidationErrorMessages } from '../../shared/constants';

export const initialValues: UserChangePasswordRequestDto = {
  oldPassword: '',
  password: '',
  confirmPassword: '',
};

export const transformValues = (values: UserChangePasswordRequestDto) => ({
  oldPassword: values.oldPassword.trim(),
  password: values.password.trim(),
  confirmPassword: values.confirmPassword.trim(),
});

export const validationSchema = zod
  .object({
    oldPassword: zod
      .string()
      .trim()
      .min(6, ValidationErrorMessages.PasswordLength)
      .min(1, ValidationErrorMessages.RequiredField),
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
