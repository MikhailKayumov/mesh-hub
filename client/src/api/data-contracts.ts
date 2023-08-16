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
  token?: string;
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

export type HttpException = Record<string | number, any>;
