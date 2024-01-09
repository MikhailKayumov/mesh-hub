import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo } from 'react';
import { Model3DResponseDto } from '@/api/dto.ts';
import { useUpdateModel3DMutation } from '@/api/models-3d.ts';
import { useCategoriesQuery } from '@/api/resources.ts';
import getFormDirtyFields from '@/utils/getFormDirtyFields.ts';
import processFormSubmitError from '@/utils/processFormSubmitError.ts';
import {
  initialValues,
  transformValuesFromFormToRequest,
  transformValuesFromModel3DToForm,
  validationSchema,
} from './constants.ts';
import { Model3DPropertiesForm } from './model.ts';

export default function useModel3DEditPropertiesForm(model: Model3DResponseDto | null, onClose: () => void) {
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [update] = useUpdateModel3DMutation();
  const { data: categories } = useCategoriesQuery();
  const form = useForm<Model3DPropertiesForm>({
    initialValues,
    validate: zodResolver(validationSchema),
  });

  useEffect(() => {
    if (!model) return;

    form.setInitialValues(transformValuesFromModel3DToForm(model));
    form.reset();
  }, [model]);

  return {
    form,
    isSubmitting,
    categories: useMemo(() => (categories ?? []).map((c) => c.name), [categories]),
    onSubmit: form.onSubmit(async (rawData) => {
      if (!model) return;

      const [data, count] = getFormDirtyFields<Model3DPropertiesForm>(form, rawData);
      if (!count) return;

      try {
        submitStart();
        await update({ id: model.id, body: transformValuesFromFormToRequest(data, categories) }).unwrap();
        notifications.show({ message: 'Информация о модели успешно изменена', color: 'green', autoClose: 3000 });
        onClose();
      } catch (e) {
        processFormSubmitError<Model3DPropertiesForm>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
