import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useEffect } from 'react';
import useCurrentUser from '@/hooks/useCurrentUser.ts';
import getFormDirtyFields from '@/utils/getFormDirtyFields.ts';
import sleep from '@/utils/sleep.ts';

export interface ProfileFormData {
  lastName?: string;
  firstName?: string;
  middleName?: string;
  phone?: string;
  email?: string;
  aboutYourself?: string;
  favoriteSoft?: string[];
}

export default function useProfileForm() {
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);
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
    transformValues: (values) => ({
      lastName: values.lastName?.trim(),
      firstName: values.firstName?.trim(),
      middleName: values.middleName?.trim(),
      phone: values.phone?.trim(),
      email: values.email?.trim(),
      aboutYourself: values.aboutYourself?.trim(),
      favoriteSoft: values.favoriteSoft,
    }),
  });

  useEffect(() => {
    if (!user) return;

    form.setInitialValues({
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      phone: '',
      email: user.email,
      aboutYourself: '',
      favoriteSoft: [],
    });

    form.reset();
  }, [user]);

  return {
    form,
    isSubmitting,
    isLoading: isUserLoading,
    onSubmit: form.onSubmit(async (data) => {
      try {
        submitStart();

        await sleep(0.5);
        console.log(getFormDirtyFields(form, data));
      } catch (e) {
        console.log(e);
      } finally {
        submitEnd();
      }
    }),
  };
}
