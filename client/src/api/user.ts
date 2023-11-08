import Api from './base';
import ApiTags from './tags';
import ApiUrls from './urls';
import { UserResponseDto } from './dto';

const UserApi = Api.injectEndpoints({
  endpoints: (build) => ({
    currentUser: build.query<UserResponseDto, void>({
      providesTags: [ApiTags.Reset, ApiTags.CurrentUser],
      query: () => ({
        method: 'GET',
        url: ApiUrls.CurrentUser,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useCurrentUserQuery } = UserApi;

export default UserApi;
