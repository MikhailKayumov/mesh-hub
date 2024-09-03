import zod from 'zod';
import { CategoryRequest, CategoryResponse, Model3DResponseDto, Model3DUpdateRequestDto } from '@/app/api/dto.ts';
import {
  MAX_MODEL_3D_CATEGORIES_LENGTH,
  MAX_MODEL_3D_NAME_LENGTH,
  ValidationErrorMessages,
} from '../../../../../../../../shared/constants';
import { Model3DPropertiesForm } from './model.ts';

export const initialValues: Model3DPropertiesForm = {
  name: '',
  description: null,
  visible: false,
  categories: [],
};

export const validationSchema = zod.object({
  name: zod
    .string()
    .trim()
    .min(1, ValidationErrorMessages.RequiredField)
    .max(MAX_MODEL_3D_NAME_LENGTH, ValidationErrorMessages.MaxModel3DNameLength),
  categories: zod
    .string()
    .array()
    .max(MAX_MODEL_3D_CATEGORIES_LENGTH, ValidationErrorMessages.MaxModel3DCategoriesLength)
    .optional(),
});

export const transformValuesFromFormToRequest = (
  values: Partial<Model3DPropertiesForm>,
  categories: CategoryResponse[] = [],
): Model3DUpdateRequestDto => {
  return {
    name: values.name?.trim(),
    description: values.description!,
    isVisible: values.visible,
    categories: values.categories?.reduce<CategoryRequest[]>((acc, name) => {
      const category = categories.find((c) => c.name === name);
      if (category) acc.push(category);
      return acc;
    }, []),
  };
};

export const transformValuesFromModel3DToForm = (model: Model3DResponseDto): Model3DPropertiesForm => {
  return {
    name: model.name,
    description: model.description ?? null,
    visible: model.isVisible,
    categories: model.categories?.map((c) => c.name) ?? [],
  };
};
