import { object, string } from 'zod';
import { SignupRequestDto } from '@/app/api/dto.ts';
import { AppRegexp, ValidationErrorMessages } from '@/shared/constants';

export const initialValues: SignupRequestDto = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const transformValues = (values: SignupRequestDto) => ({
  firstName: values.firstName.trim(),
  lastName: values.lastName?.trim() ?? '',
  email: values.email.trim(),
  password: values.password.trim(),
  confirmPassword: values.confirmPassword.trim(),
});

export const validationSchema = object({
  firstName: string().trim().min(1, ValidationErrorMessages.RequiredField),
  lastName: string().trim(),
  email: string().trim().email(ValidationErrorMessages.Email).min(1, ValidationErrorMessages.RequiredField),
  password: string()
    .trim()
    .regex(AppRegexp.Password, ValidationErrorMessages.PasswordContent)
    .min(6, ValidationErrorMessages.PasswordLength)
    .min(1, ValidationErrorMessages.RequiredField),
  confirmPassword: string()
    .trim()
    .regex(AppRegexp.Password, ValidationErrorMessages.PasswordContent)
    .min(6, ValidationErrorMessages.PasswordLength)
    .min(1, ValidationErrorMessages.RequiredField),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});
