import { Api } from './base.ts';
import { CategoryResponse, CgSoftResponse } from './dto.ts';
import { ApiTags } from './tags.ts';
import { ApiUrls } from './urls.ts';

export const ResourcesApi = Api.injectEndpoints({
  endpoints: (build) => ({
    cgSoft: build.query<CgSoftResponse[], void>({
      providesTags: [ApiTags.Reset, ApiTags.CGSoft],
      query: () => ({
        method: 'GET',
        url: ApiUrls.ResourcesCGSoft,
      }),
    }),
    categories: build.query<CategoryResponse[], void>({
      providesTags: [ApiTags.Reset, ApiTags.Categories],
      query: () => ({
        method: 'GET',
        url: ApiUrls.ResourcesCategories,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useCgSoftQuery, useCategoriesQuery } = ResourcesApi;
