import { MAX_MODEL_3D_CATEGORIES_LENGTH, MAX_MODEL_3D_NAME_LENGTH } from '@/shared/constants/model3d.ts';

export const ValidationErrorMessages = {
  RequiredField: 'Обязательное поле',
  Email: 'Некорректный адрес электронной почты',
  PasswordContent:
    'Пароль должен содержать как минимум одну букву в верхнем регистре и одну в нижнем, одну цифру и один спецсимвол',
  PasswordLength: 'Пароль должен иметь длину от 6 символов',
  MaxModel3DNameLength: `Максимальное количество символов в имени модели не должно превышать ${MAX_MODEL_3D_NAME_LENGTH} символов`,
  MaxModel3DCategoriesLength: `Максимальное количество категорий для модели не должно превышать ${MAX_MODEL_3D_CATEGORIES_LENGTH}`,
} as const;
