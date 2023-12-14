import zod from 'zod';
import { LoginRequestDto } from '@/api/dto.ts';
import { ValidationErrorMessages } from '@/constants';

export const initialValues: LoginRequestDto = {
  email: import.meta.env.VITE_APP_TEST_USER_EMAIL ?? '',
  password: import.meta.env.VITE_APP_TEST_USER_PASSWORD ?? '',
};

export const transformValues = (values: LoginRequestDto) => ({
  email: values.email.trim(),
  password: values.password.trim(),
});

export const validationSchema = zod.object({
  email: zod.string().trim().email(ValidationErrorMessages.Email).min(1, ValidationErrorMessages.RequiredField),
  password: zod
    .string()
    .trim()
    .min(6, ValidationErrorMessages.PasswordLength)
    .min(1, ValidationErrorMessages.RequiredField),
});
