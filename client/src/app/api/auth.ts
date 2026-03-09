import type {
  LoginRequestDto,
  PaginationDto,
  PaginationResponseDto,
  SessionResponseDto,
  SignupRequestDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';
import { ApiUrls } from './urls.ts';

export const AuthApi = Api.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<SessionResponseDto, SignupRequestDto>({
      invalidatesTags: [ApiTags.CurrentUser, ApiTags.Get3DModel],
      query: (body) => ({
        body,
        method: 'POST',
        url: ApiUrls.Register,
      }),
    }),
    login: build.mutation<SessionResponseDto, LoginRequestDto>({
      invalidatesTags: [ApiTags.CurrentUser, ApiTags.Get3DModel],
      query: (body) => ({
        body,
        method: 'POST',
        url: ApiUrls.Login,
      }),
    }),
    logout: build.mutation<void, void>({
      invalidatesTags: [ApiTags.CurrentUser, ApiTags.Get3DModel],
      query: () => ({
        method: 'POST',
        url: ApiUrls.Logout,
      }),
    }),
    currentUserSessions: build.query<PaginationResponseDto<SessionResponseDto>, PaginationDto<never>>({
      providesTags: [ApiTags.CurrentUser],
      query: (params) => ({
        method: 'GET',
        url: ApiUrls.CurrentUserSessions,
        params,
      }),
    }),
    closeCurrentUserSession: build.mutation<void, string>({
      invalidatesTags: [ApiTags.CurrentUser],
      query: (id) => ({
        method: 'DELETE',
        url: `${ApiUrls.CloseCurrentUserSessions}/${id}`,
      }),
    }),
    closeCurrentUserSessions: build.mutation<void, void>({
      invalidatesTags: [ApiTags.CurrentUser, ApiTags.Get3DModel],
      query: () => ({
        method: 'DELETE',
        url: ApiUrls.CloseCurrentUserSessions,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useCurrentUserSessionsQuery,
  useCloseCurrentUserSessionMutation,
  useCloseCurrentUserSessionsMutation,
} = AuthApi;
