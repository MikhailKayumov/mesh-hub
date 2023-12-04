/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

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

export interface UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickname?: string;
  isConfirmed: boolean;
  sessions?: SessionResponseDto[];
}

export interface SessionResponseDto {
  id: string;
  user: UserResponseDto;
  ip: string;
  userAgent?: string;
}

export interface UserCreateRequestDto {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}

export interface UserResetPasswordRequestDto {
  email: string;
}

export interface UserChangePasswordRequestDto {
  requestId: string;
  password: string;
  confirmPassword: string;
}

export interface UserUpdateRequestDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickname?: string;
}

export interface LoginRequestDto {
  email: string;
  /** @minLength 6 */
  password: string;
}
