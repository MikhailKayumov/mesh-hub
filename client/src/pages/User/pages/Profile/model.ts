import { UserCurrentUpdateRequestDto } from '@/app/api/dto.ts';

export interface ProfileFormData extends Omit<UserCurrentUpdateRequestDto, 'favoriteSoft'> {
  email?: string;
  favoriteSoft?: string[];
}
