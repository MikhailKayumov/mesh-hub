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

export interface UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickname?: string;
  sessions?: SessionResponseDto[];
}

export interface SessionResponseDto {
  id: string;
  user?: UserResponseDto;
}

export interface UserCreateRequestDto {
  email: string;
  password: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickname?: string;
}

export interface UserUpdateRequestDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickname?: string;
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
