import zod from 'zod';
import { CgSoftRequest, CgSoftResponse, UserCurrentResponseDto, UserCurrentUpdateRequestDto } from '@/api/dto.ts';
import { ValidationErrorMessages } from '@/constants';
import { ProfileFormData } from '@/pages/Profile/model.ts';

export const initialValues: ProfileFormData = {
  lastName: '',
  firstName: '',
  middleName: '',
  email: '',
  phone: '',
  aboutYourself: '',
  favoriteSoft: [],
};

export const validationSchema = zod.object({
  firstName: zod.string().trim().min(1, ValidationErrorMessages.RequiredField),
  middleName: zod.string().trim(),
  lastName: zod.string().trim(),
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
