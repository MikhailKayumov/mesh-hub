import { object, string } from 'zod';
import type { CgSoftRequest, CgSoftResponse, UserCurrentResponseDto, UserCurrentUpdateRequestDto } from '@/app/api/dto.ts';
import type { ProfileFormData } from '@/pages/User/pages/Profile/model.ts';
import { AppRegexp, ValidationErrorMessages } from '@/shared/constants';

export const initialValues: ProfileFormData = {
  lastName: '',
  firstName: '',
  middleName: '',
  email: '',
  phone: '',
  aboutYourself: '',
  favoriteSoft: [],
};

export const validationSchema = object({
  firstName: string().trim().min(1, ValidationErrorMessages.RequiredField),
  middleName: string().trim(),
  lastName: string().trim(),
  phone: string().refine(
    (value) => !value || AppRegexp.RussianPhone.test(`+7${value}`),
    'Некорректный формат номера телефона',
  ),
  aboutYourself: string().trim(),
  favoriteSoft: string().array().optional(),
});

export const transformValuesFromFormToRequest = (
  values: ProfileFormData,
  software: CgSoftResponse[] = [],
): UserCurrentUpdateRequestDto => {
  const phone = values.phone?.trim();

  return {
    lastName: values.lastName?.trim(),
    firstName: values.firstName?.trim(),
    middleName: values.middleName?.trim(),
    phone: phone ? `+7${phone}` : undefined,
    aboutYourself: values.aboutYourself?.trim(),
    favoriteSoft: values.favoriteSoft?.reduce<CgSoftRequest[]>((acc, rawName) => {
      const name = rawName.trim();

      const soft = software.find((soft) => soft.name === name);
      if (name) acc.push(soft ?? { id: 'new', name });

      return acc;
    }, []),
  };
};

export const transformValuesFromUserToForm = (user: UserCurrentResponseDto): ProfileFormData => {
  return {
    lastName: user.lastName ?? '',
    firstName: user.firstName ?? '',
    middleName: user.middleName ?? '',
    phone: user.phone?.replace('+7', '') ?? '',
    email: user.email ?? '',
    aboutYourself: user.meta?.aboutYourself ?? '',
    favoriteSoft: (user.meta?.favoriteSoft ?? []).map((s) => s.name),
  };
};
