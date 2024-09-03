import { UseFormReturnType } from '@mantine/form';

export function getFormDirtyFields<T extends Record<string | number, any>>(
  form: UseFormReturnType<T>,
  data: T,
): [Partial<T>, number] {
  return Object.entries(data).reduce<[Partial<T>, number]>(
    (acc, [key, value]) => {
      if (form.isDirty(key)) {
        acc[0][key as any] = value;
        acc[1]++;
      }

      return acc;
    },
    [{}, 0],
  );
}
