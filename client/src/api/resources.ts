import Api from './base';
import { CgSoftResponse } from './dto';
import ApiTags from './tags';
import ApiUrls from './urls';

const ResourcesApi = Api.injectEndpoints({
  endpoints: (build) => ({
    cgSoft: build.query<CgSoftResponse[], void>({
      providesTags: [ApiTags.Reset, ApiTags.CGSoft],
      query: () => ({
        method: 'GET',
        url: ApiUrls.ResourcesCGSoft,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useCgSoftQuery } = ResourcesApi;

export default ResourcesApi;
