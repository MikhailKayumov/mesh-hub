import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo } from 'react';
import { useUpdateModel3DMutation } from '@/app/api/models-3d.ts';
import { useCategoriesQuery } from '@/app/api/resources.ts';
import { useModel3DContext } from '@/contexts/Model3DContext/useModel3DContext.ts';
import { getFormDirtyFields } from '@/shared/utils/getFormDirtyFields.ts';
import { processFormSubmitError } from '@/shared/utils/processFormSubmitError.ts';
import {
  initialValues,
  transformValuesFromFormToRequest,
  transformValuesFromModel3DToForm,
  validationSchema,
} from './constants.ts';
import { Model3DPropertiesForm } from './model.ts';

export function useModel3DEditPropertiesForm(onSubmitted: () => void) {
  const model = useModel3DContext();
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
        onSubmitted();
      } catch (e) {
        processFormSubmitError<Model3DPropertiesForm>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
