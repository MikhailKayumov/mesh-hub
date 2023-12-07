import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { UserCurrentUpdateRequestDto } from '@/api/dto.ts';
import { useUpdateCurrentUserMutation } from '@/api/user.ts';
import useCurrentUser from '@/hooks/useCurrentUser.ts';
import getFormDirtyFields from '@/utils/getFormDirtyFields.ts';
import processFormSubmitError from '@/utils/processFormSubmitError.ts';

export interface ProfileFormData extends UserCurrentUpdateRequestDto {
  email?: string;
}

export default function useProfileForm() {
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
  const [update] = useUpdateCurrentUserMutation();
  const { user, isUserLoading } = useCurrentUser();

  const form = useForm<ProfileFormData>({
    initialValues: {
      lastName: '',
      firstName: '',
      middleName: '',
      email: '',
      phone: '',
      aboutYourself: '',
      favoriteSoft: [],
    },
    transformValues: (values) => {
      const phone = values.phone?.trim();

      return {
        lastName: values.lastName?.trim(),
        firstName: values.firstName?.trim(),
        middleName: values.middleName?.trim(),
        phone: phone ? `+7${phone}` : undefined,
        aboutYourself: values.aboutYourself?.trim(),
        favoriteSoft: values.favoriteSoft,
      };
    },
  });

  useEffect(() => {
    if (!user) return;

    form.setInitialValues({
      lastName: user.lastName ?? '',
      firstName: user.firstName ?? '',
      middleName: user.middleName ?? '',
      phone: '',
      email: user.email ?? '',
      aboutYourself: '',
      favoriteSoft: [],
    });

    form.reset();
  }, [user]);

  return {
    form,
    isSubmitting,
    isLoading: isUserLoading,
    onSubmit: form.onSubmit(async (rawData) => {
      const [data, count] = getFormDirtyFields(form, rawData);
      if (!count) return;

      try {
        submitStart();
        await update(data).unwrap();

        notifications.show({ message: 'Данные профиля успешно изменены', color: 'green', autoClose: 3000 });
      } catch (e) {
        processFormSubmitError<ProfileFormData>(form, e);
      } finally {
        submitEnd();
      }
    }),
  };
}
