import { Rule } from 'rc-field-form/lib/interface';
import { LoginFormData } from '~/modules/auth/components/LoginForm/index';

export const common: Rule[] = [{ required: true, message: 'Обязательное поле!' }];

export const validationRules: Record<keyof LoginFormData, Rule[]> = {
  email: [...common, { pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, message: 'Неверный формат электронной почты.' }],
  password: [
    ...common,
    { required: true, message: 'Обязательное поле.' },
    { min: 8, message: 'Минимальная длинна пароля 8 символов.' },
    { max: 24, message: 'Максимальная длинна пароля 24 символов.' },
    {
      pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).*$/,
      message:
        'Пароль должен содержать хотя бы по одной из строчных и прописных букв латинского алфавита и одной цифры.',
    },
  ],
};
