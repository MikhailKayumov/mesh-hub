import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo } from 'react';
import { useCgSoftQuery } from '@/api/resources.ts';
import { useUpdateCurrentUserMutation } from '@/api/user.ts';
import useCurrentUser from '@/hooks/useCurrentUser.ts';
import {
  initialValues,
  transformValuesFromFormToRequest,
  transformValuesFromUserToForm,
  validationSchema,
} from '@/pages/User/pages/Profile/constants.ts';
import { ProfileFormData } from '@/pages/User/pages/Profile/model.ts';
import getFormDirtyFields from '@/utils/getFormDirtyFields.ts';
import processFormSubmitError from '@/utils/processFormSubmitError.ts';

export default function useProfileForm() {
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [update] = useUpdateCurrentUserMutation();
  const { user, isUserLoading } = useCurrentUser();
  const { data: software } = useCgSoftQuery();

  const form = useForm<ProfileFormData>({
    initialValues,
    validate: zodResolver(validationSchema),
  });

  useEffect(() => {
    if (!user) return;

    form.setInitialValues(transformValuesFromUserToForm(user));
    form.reset();
  }, [user]);

  return {
    form,
    isSubmitting,
    isLoading: isUserLoading,
    onSubmit: form.onSubmit(async (rawData) => {
      const [data, count] = getFormDirtyFields<ProfileFormData>(form, rawData);
      if (!count) return;

      try {
        submitStart();

        await update(transformValuesFromFormToRequest(data, software)).unwrap();

        notifications.show({ message: 'Данные профиля успешно изменены', color: 'green', autoClose: 3000 });
      } catch (e) {
        processFormSubmitError<ProfileFormData>(form, e);
      } finally {
        submitEnd();
      }
    }),
    software: useMemo(() => (software ?? []).map((soft) => soft.name), [software]),
  };
}
