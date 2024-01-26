import { UseFormReturnType } from '@mantine/form';

export interface SceneLayer {
  value: number;
  label: string;
  checked: boolean;
}

export interface LayersCheckboxGroupProps<
  FormValues extends Record<string | number, any> = Record<string | number, any>,
> {
  form: UseFormReturnType<FormValues & { layers: SceneLayer[] }>;
  className?: string;
  defaultOpened?: boolean;
}
