import { SceneTabFormValues } from './model.ts';

export const initialValues: SceneTabFormValues = {
  layers: Array.from(new Array(32), (_, index) => ({ checked: index < 2, value: index, label: `${index}` })),
};
