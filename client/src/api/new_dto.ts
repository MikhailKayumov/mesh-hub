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
  userAgent?: string;
}

export interface LoginRequestDto {
  email: string;
  /** @minLength 6 */
  password: string;
}
