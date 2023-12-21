import Api from '@/api/base.ts';
import { PaginationResponseDto, Model3DResponseDto, PaginationDto } from '@/api/dto.ts';
import ApiTags from '@/api/tags.ts';
import ApiUrls from '@/api/urls.ts';

const Models3dApi = Api.injectEndpoints({
  endpoints: (build) => ({
    models3D: build.query<PaginationResponseDto<Model3DResponseDto>, PaginationDto<any>>({
      providesTags: [ApiTags.Get3DModels],
      query: (params) => ({
        method: 'GET',
        url: ApiUrls.Get3DModels,
        params,
      }),
    }),
    model3D: build.query<Model3DResponseDto, string>({
      providesTags: (_result, _error, arg) => [ApiTags.Reset, { type: ApiTags.Get3DModel, id: arg }],
      query: (id) => ({
        method: 'GET',
        url: `${ApiUrls.Get3DModels}/${id}`,
      }),
    }),
    currentUser3DModels: build.query<PaginationResponseDto<Model3DResponseDto>, PaginationDto<any>>({
      providesTags: [ApiTags.Reset, ApiTags.CurrentUser3DModels],
      query: (params) => ({
        method: 'GET',
        url: ApiUrls.CurrentUser3DModels,
        params,
      }),
    }),
    upload3DModel: build.mutation<{ modelId: string }, FormData>({
      invalidatesTags: [ApiTags.CurrentUser3DModels, ApiTags.Get3DModels],
      query: (body) => ({
        method: 'POST',
        url: ApiUrls.Upload3DModel,
        body,
      }),
    }),
    delete3DModel: build.mutation<void, string>({
      invalidatesTags: [ApiTags.CurrentUser3DModels, ApiTags.Get3DModels],
      query: (id) => ({
        method: 'DELETE',
        url: `${ApiUrls.Get3DModels}/${id}`,
      }),
    }),
    saveThumbnailBase64: build.mutation<void, { id: string; thumbnail: string }>({
      invalidatesTags: [ApiTags.CurrentUser3DModels, ApiTags.Get3DModels],
      query: ({ id, thumbnail }) => ({
        method: 'POST',
        url: `${ApiUrls.Get3DModels}/${id}/${ApiUrls.SaveThumbnailBase64}`,
        body: { thumbnail },
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useUpload3DModelMutation,
  useCurrentUser3DModelsQuery,
  useDelete3DModelMutation,
  useModels3DQuery,
  useModel3DQuery,
  useSaveThumbnailBase64Mutation,
} = Models3dApi;

export default Models3dApi;
