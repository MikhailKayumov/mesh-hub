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

import {
  HttpException,
  LoginRequestDto,
  PaginationDtoSortItem,
  SessionResponseDto,
  UserCreateRequestDto,
  UserResponseDto,
  UserUpdateRequestDto,
} from "./data-contracts";
import { ContentType, HttpClient, HttpResponse, RequestParams } from "./http-client";

export interface BaseHttpClient {
  request<T = any, E = any>(params: any): Promise<HttpResponse<T, E>>;
}

export default class Api<SecurityDataType = unknown> {
  public readonly httpClient: HttpClient;

  public constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  public userControllerGetUsers = (
    query?: {
      skip?: number;
      /** @min 1 */
      size?: number;
      /** Sorting fields in format: [+-][fieldName] */
      sort?: string;
    },
    params: RequestParams = {},
  ): Promise<
    HttpResponse<
      {
        data: UserResponseDto[];
        skip: number;
        size: number;
        sort: PaginationDtoSortItem[];
        totalCount: number;
        hasMore: boolean;
      },
      HttpException
    >
  > => {
    return this.httpClient.request<
      {
        data: UserResponseDto[];
        skip: number;
        size: number;
        sort: PaginationDtoSortItem[];
        totalCount: number;
        hasMore: boolean;
      },
      HttpException
    >({
      path: `/api/user`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  };

  public userControllerCreateUser = (
    data: UserCreateRequestDto,
    params: RequestParams = {},
  ): Promise<HttpResponse<UserResponseDto, HttpException>> => {
    return this.httpClient.request<UserResponseDto, HttpException>({
      path: `/api/user`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  };

  public userControllerGetUser = (
    id: string,
    params: RequestParams = {},
  ): Promise<HttpResponse<UserResponseDto, HttpException>> => {
    return this.httpClient.request<UserResponseDto, HttpException>({
      path: `/api/user/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  };

  public userControllerUpdateUser = (
    id: string,
    data: UserUpdateRequestDto,
    params: RequestParams = {},
  ): Promise<HttpResponse<UserResponseDto, HttpException>> => {
    return this.httpClient.request<UserResponseDto, HttpException>({
      path: `/api/user/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  };

  public userControllerDeleteUser = (
    id: string,
    params: RequestParams = {},
  ): Promise<HttpResponse<void, HttpException>> => {
    return this.httpClient.request<void, HttpException>({
      path: `/api/user/${id}`,
      method: "DELETE",
      ...params,
    });
  };

  public authControllerSignup = (
    data: UserCreateRequestDto,
    params: RequestParams = {},
  ): Promise<HttpResponse<SessionResponseDto, HttpException>> => {
    return this.httpClient.request<SessionResponseDto, HttpException>({
      path: `/api/auth/signup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  };

  public authControllerLogin = (
    data: LoginRequestDto,
    params: RequestParams = {},
  ): Promise<HttpResponse<SessionResponseDto, HttpException>> => {
    return this.httpClient.request<SessionResponseDto, HttpException>({
      path: `/api/auth/login`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  };

  public authControllerLogout = (params: RequestParams = {}): Promise<HttpResponse<void, HttpException>> => {
    return this.httpClient.request<void, HttpException>({
      path: `/api/auth/logout`,
      method: "POST",
      ...params,
    });
  };

  public authControllerRefresh = (
    params: RequestParams = {},
  ): Promise<HttpResponse<SessionResponseDto, HttpException>> => {
    return this.httpClient.request<SessionResponseDto, HttpException>({
      path: `/api/auth/refresh`,
      method: "POST",
      format: "json",
      ...params,
    });
  };
}
