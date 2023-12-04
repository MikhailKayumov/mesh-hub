import Api from './base';
import { UserResponseDto } from './dto';
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
      query: (email: string) => ({
        method: 'PATCH',
        url: `${ApiUrls.ResetPassword}`,
        body: { email },
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useCurrentUserQuery, useResetPasswordMutation } = UserApi;

export default UserApi;
