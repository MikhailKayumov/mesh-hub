import Api from './base';
import {
  UserChangePasswordRequestDto,
  UserNewPasswordRequestDto,
  UserCurrentResponseDto,
  UserCurrentUpdateRequestDto,
} from './dto';
import ApiTags from './tags';
import ApiUrls from './urls';

const UserApi = Api.injectEndpoints({
  endpoints: (build) => ({
    currentUser: build.query<UserCurrentResponseDto, void>({
      providesTags: [ApiTags.Reset, ApiTags.CurrentUser],
      query: () => ({
        method: 'GET',
        url: ApiUrls.CurrentUser,
      }),
    }),
    updateCurrentUser: build.mutation<void, UserCurrentUpdateRequestDto>({
      invalidatesTags: [ApiTags.CurrentUser, ApiTags.CGSoft],
      query: (body) => ({
        method: 'PATCH',
        url: ApiUrls.CurrentUser,
        body,
      }),
    }),
    updateCurrentUserAvatar: build.mutation<void, { file?: Blob }>({
      invalidatesTags: [ApiTags.CurrentUser],
      query: (body) => ({
        method: 'POST',
        url: ApiUrls.UpdateCurrentUserAvatar,
        body,
      }),
    }),
    resetPassword: build.mutation<void, string>({
      query: (email) => ({
        method: 'PATCH',
        url: ApiUrls.ResetPassword,
        body: { email },
      }),
    }),
    newPassword: build.mutation<void, UserNewPasswordRequestDto>({
      query: (body) => ({
        method: 'PATCH',
        url: ApiUrls.NewPassword,
        body,
      }),
    }),
    changePassword: build.mutation<void, UserChangePasswordRequestDto>({
      query: (body) => ({
        method: 'PATCH',
        url: ApiUrls.ChangePassword,
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useCurrentUserQuery,
  useResetPasswordMutation,
  useNewPasswordMutation,
  useChangePasswordMutation,
  useUpdateCurrentUserMutation,
  useUpdateCurrentUserAvatarMutation,
} = UserApi;

export default UserApi;
