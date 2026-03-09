import { object, string } from 'zod';
import { type UserNewPasswordRequestDto } from '@/app/api/dto.ts';
import { AppRegexp, ValidationErrorMessages } from '@/shared/constants';

export type UserNewPasswordFormData = Omit<UserNewPasswordRequestDto, 'requestId'>;

export const initialValues: UserNewPasswordFormData = {
  password: '',
  confirmPassword: '',
};

export const transformValues = (values: UserNewPasswordFormData) => ({
  password: values.password.trim(),
  confirmPassword: values.confirmPassword.trim(),
});

export const validationSchema = object({
  password: string()
    .trim()
    .regex(AppRegexp.Password, ValidationErrorMessages.PasswordContent)
    .min(6, ValidationErrorMessages.PasswordLength)
    .min(1, ValidationErrorMessages.RequiredField),
  confirmPassword: string().trim().min(1, ValidationErrorMessages.RequiredField),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});
