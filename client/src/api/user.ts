import Api from './base';
import { UserChangePasswordRequestDto, UserResponseDto } from './dto';
import ApiTags from './tags';
import ApiUrls from './urls';

const UserApi = Api.injectEndpoints({
  endpoints: (build) => ({
    currentUser: build.query<UserResponseDto, void>({
      providesTags: [ApiTags.Reset, ApiTags.CurrentUser],
      query: () => ({
        method: 'GET',
        url: ApiUrls.CurrentUser,
      }),
    }),
    resetPassword: build.mutation<void, string>({
      query: (email) => ({
        method: 'PATCH',
        url: `${ApiUrls.ResetPassword}`,
        body: { email },
      }),
    }),
    changePassword: build.mutation<void, UserChangePasswordRequestDto>({
      query: (body) => ({
        method: 'PATCH',
        url: `${ApiUrls.ChangePassword}`,
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useCurrentUserQuery, useResetPasswordMutation, useChangePasswordMutation } = UserApi;

export default UserApi;
