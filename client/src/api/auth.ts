import Api from './base';
import { LoginRequestDto, SessionResponseDto, UserCreateRequestDto } from './dto';
import ApiTags from './tags';
import ApiUrls from './urls';

const AuthApi = Api.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<SessionResponseDto, UserCreateRequestDto>({
      invalidatesTags: [ApiTags.CurrentUser],
      query: (body) => ({
        body,
        method: 'POST',
        url: ApiUrls.Register,
      }),
    }),
    login: build.mutation<SessionResponseDto, LoginRequestDto>({
      invalidatesTags: [ApiTags.CurrentUser],
      query: (body) => ({
        body,
        method: 'POST',
        url: ApiUrls.Login,
      }),
    }),
    logout: build.mutation<void, void>({
      invalidatesTags: [ApiTags.CurrentUser],
      query: () => ({
        method: 'POST',
        url: ApiUrls.Logout,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation } = AuthApi;

export default AuthApi;
