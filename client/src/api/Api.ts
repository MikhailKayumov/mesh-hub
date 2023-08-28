import { HttpService } from '~/api/http.service';
import { ApiUser } from '~/api/ApiUser';
import { ApiAuth } from './ApiAuth';

const Api = {
  auth: new ApiAuth(new HttpService(), 'auth'),
  user: new ApiUser(new HttpService(), 'user'),

  // public userControllerGetUsers = (
  //   query?: {
  //     skip?: number;
  //     size?: number;
  //     sort?: string;
  //   },
  //   params: RequestParams = {},
  // ): Promise<
  //   HttpResponse<
  //     PaginationResponseDto & {
  //       data: UserResponseDto[];
  //     },
  //     HttpException
  //   >
  // > => {
  //   return this.httpClient.request<
  //     PaginationResponseDto & {
  //       data: UserResponseDto[];
  //     },
  //     HttpException
  //   >({
  //     path: `/api/user`,
  //     method: 'GET',
  //     query: query,
  //     format: 'json',
  //     ...params,
  //   });
  // };
  //
  // public userControllerCreateUser = (
  //   data: UserCreateRequestDto,
  //   params: RequestParams = {},
  // ): Promise<HttpResponse<UserResponseDto, HttpException>> => {
  //   return this.httpClient.request<UserResponseDto, HttpException>({
  //     path: `/api/user`,
  //     method: 'POST',
  //     body: data,
  //     type: ContentType.Json,
  //     format: 'json',
  //     ...params,
  //   });
  // };
  //
  // public userControllerGetUser = (
  //   id: string,
  //   params: RequestParams = {},
  // ): Promise<HttpResponse<UserResponseDto, HttpException>> => {
  //   return this.httpClient.request<UserResponseDto, HttpException>({
  //     path: `/api/user/${id}`,
  //     method: 'GET',
  //     format: 'json',
  //     ...params,
  //   });
  // };
  //
  // public userControllerUpdateUser = (
  //   id: string,
  //   data: UserUpdateRequestDto,
  //   params: RequestParams = {},
  // ): Promise<HttpResponse<UserResponseDto, HttpException>> => {
  //   return this.httpClient.request<UserResponseDto, HttpException>({
  //     path: `/api/user/${id}`,
  //     method: 'PATCH',
  //     body: data,
  //     type: ContentType.Json,
  //     format: 'json',
  //     ...params,
  //   });
  // };
  //
  // public userControllerDeleteUser = (
  //   id: string,
  //   params: RequestParams = {},
  // ): Promise<HttpResponse<void, HttpException>> => {
  //   return this.httpClient.request<void, HttpException>({
  //     path: `/api/user/${id}`,
  //     method: 'DELETE',
  //     ...params,
  //   });
  // };
  //
  // public authControllerSignup = (
  //   data: UserCreateRequestDto,
  //   params: RequestParams = {},
  // ): Promise<HttpResponse<SessionResponseDto, HttpException>> => {
  //   return this.httpClient.request<SessionResponseDto, HttpException>({
  //     path: `/api/auth/signup`,
  //     method: 'POST',
  //     body: data,
  //     type: ContentType.Json,
  //     format: 'json',
  //     ...params,
  //   });
  // };
  //
};

export default Api;
