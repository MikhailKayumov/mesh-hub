import { UseFormReturnType } from '@mantine/form';

export default function getFormDirtyFields<T extends Record<string | number, any>>(
  form: UseFormReturnType<T>,
  data: T,
): Partial<T> {
  return Object.entries(data).reduce<Partial<T>>((acc, [key, value]) => {
    if (form.isDirty(key)) {
      acc[key as any] = value;
    }

    return acc;
  }, {});
}
