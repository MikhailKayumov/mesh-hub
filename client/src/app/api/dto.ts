export interface PaginationDtoSortItem {
  field: string;
  by: 'ASC' | 'DESC';
}

export interface PaginationDto<T = any> {
  skip?: number;
  size?: number;
  sort?: string[];
  body?: T;
}

export interface PaginationResponseDto<T = any> {
  data: T[];
  skip: number;
  size: number;
  sort: PaginationDtoSortItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface CgSoftRequest {
  id: string | number;
  name: string;
}

export interface CgSoftResponse {
  id: number;
  name: string;
  description?: string;
}

export interface UserMetaResponseDto {
  id: string;
  avatar?: string;
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
  favoriteSoft?: CgSoftRequest[];
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
  createdAt: string;
  updatedAt?: string;
  expireAt: string;
  userAgent?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface Model3DFileResponseDto {
  id: string;
  createdAt: string;
  updatedAt?: string;
  name: string;
  size: number;
  extension: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
}

export interface CategoryRequest {
  id: number;
  name: string;
}

export interface Model3DResponseDto {
  id: string;
  createdAt: string;
  updatedAt?: string;
  isOwner: boolean;
  ownerAvatar?: string;
  ownerName: string;
  name: string;
  visibility: string;
  file: Model3DFileResponseDto;
  description?: Record<string, any>;
  thumbnail?: string;
  categories?: CategoryResponse[];
}

export interface Model3DUpdateRequestDto {
  name?: string;
  visibility?: string;
  description?: object;
  categories?: CategoryRequest[];
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
