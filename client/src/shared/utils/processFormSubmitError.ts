import { UseFormReturnType } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { isValidationException } from '@/app/api/utils.ts';

export function processFormSubmitError<FormData extends Record<string, any> = any>(
  form: UseFormReturnType<FormData>,
  e: unknown,
) {
  if (isValidationException<keyof FormData>(e)) {
    e.data.forEach((i) => form.setFieldError(i.property as any, i.errors.join('. ')));
  } else {
    notifications.show({
      title: 'Ошибка',
      message: (e as any)?.message ?? (e as any)?.error ?? 'Неизвестная ошибка',
      color: 'red',
      autoClose: 10000,
    });
  }
}
