import { object, string } from 'zod';
import { LoginRequestDto } from '@/app/api/dto.ts';
import { ValidationErrorMessages } from '@/shared/constants';

export const initialValues: LoginRequestDto = {
  email: import.meta.env.VITE_APP_TEST_USER_EMAIL ?? '',
  password: import.meta.env.VITE_APP_TEST_USER_PASSWORD ?? '',
};

export const transformValues = (values: LoginRequestDto) => ({
  email: values.email.trim(),
  password: values.password.trim(),
});

export const validationSchema = object({
  email: string().trim().email(ValidationErrorMessages.Email).min(1, ValidationErrorMessages.RequiredField),
  password: string()
    .trim()
    .min(6, ValidationErrorMessages.PasswordLength)
    .min(1, ValidationErrorMessages.RequiredField),
});
