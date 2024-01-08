 
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface CgSoftResponse {
  id: number;
  name: string;
  description?: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
}

export interface UserMetaResponseDto {
  id: string;
  aboutYourself?: string;
  avatar?: string;
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

export interface CgSoftRequest {
  id: string | number;
  name: string;
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
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt?: string;
  /** @format date-time */
  expireAt: string;
  userAgent?: string;
}

export interface LoginRequestDto {
  email: string;
  /** @minLength 6 */
  password: string;
}

export interface PaginationDtoSortItem {
  field: string;
  by: "ASC" | "DESC";
}

export interface PaginationResponseDto {
  data: object[];
  /** @min 0 */
  skip: number;
  /** @min 0 */
  size: number;
  sort: PaginationDtoSortItem[];
  /** @min 0 */
  totalCount: number;
  hasMore: boolean;
}

export interface Model3DFileResponseDto {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt?: string;
  name: string;
  size: number;
  extension: string;
}

export interface Model3DResponseDto {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt?: string;
  isOwner: boolean;
  ownerAvatar?: string;
  ownerName: string;
  name: string;
  isVisible: boolean;
  file: Model3DFileResponseDto;
  description?: object;
  thumbnail?: string;
  categories?: CategoryResponse[];
}

export interface CategoryRequest {
  id: number;
  name: string;
}

export interface Model3DUpdateRequestDto {
  name?: string;
  isVisible?: boolean;
  description?: object;
  categories?: CategoryRequest[];
}
