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
  sessionId: string;
  token: string;
  user?: UserResponseDto;
}

export interface UserCreateRequestDto {
  email: string;
  /**
   * @minLength 8
   * @maxLength 24
   * @pattern /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).*$/
   */
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
  /**
   * @minLength 8
   * @maxLength 24
   * @pattern passwordRegExp
   */
  password: string;
}

export type HttpException = Record<string | number, any>;
