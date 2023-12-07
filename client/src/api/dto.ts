export interface PaginationDtoSortItem {
  field: string;
  by: 'ASC' | 'DESC';
}
export interface PaginationResponseDto<T = any> {
  data: T[];
  skip: number;
  size: number;
  sort: PaginationDtoSortItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface CgSoftResponse {
  id: number;
  name: string;
  description?: string;
}

export interface UserMetaResponseDto {
  id: string;
  aboutYourself?: string;
  favoriteSoft?: CgSoftResponse[];
}

export interface UserCurrentResponseDto {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  isConfirmed: boolean;
  meta: UserMetaResponseDto;
}

export interface UserCurrentUpdateRequestDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  aboutYourself?: string;
  favoriteSoft?: string[];
}

export interface UserResetPasswordRequestDto {
  email: string;
}

export interface UserNewPasswordRequestDto {
  requestId: string;
  password: string;
  confirmPassword: string;
}

export interface UserChangePasswordRequestDto {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

export interface SignupRequestDto {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}

export interface SessionResponseDto {
  id: string;
  ip: string;
  userAgent?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

/**
 * Exceptions
 */
export interface HttpException {
  status: number;
  type?: string;
  message: string;
  error: string;
  data?: any;
}
export interface ValidationHttpException<Property = string> {
  status: 400;
  type: 'ValidationError';
  message: 'Ошибка валидации';
  error: 'Bad Request';
  data: { property: Property; errors: string[] }[];
}
