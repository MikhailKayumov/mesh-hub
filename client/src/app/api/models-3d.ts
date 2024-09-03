import { Api } from '@/app/api/base.ts';
import { PaginationResponseDto, Model3DResponseDto, PaginationDto, Model3DUpdateRequestDto } from '@/app/api/dto.ts';
import { ApiTags } from '@/app/api/tags.ts';
import { ApiUrls } from '@/app/api/urls.ts';

export const Models3dApi = Api.injectEndpoints({
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
    updateModel3D: build.mutation<Model3DResponseDto, { id: string; body: Model3DUpdateRequestDto }>({
      invalidatesTags: (_result, _error, arg) => [
        ApiTags.Reset,
        ApiTags.Get3DModels,
        { type: ApiTags.Get3DModel, id: arg.id },
      ],
      query: ({ id, body }) => ({
        method: 'PATCH',
        url: `${ApiUrls.Update3DModels}/${id}`,
        body,
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
    saveThumbnailFromBase64: build.mutation<void, { id: string; thumbnail: string }>({
      invalidatesTags: [ApiTags.CurrentUser3DModels, ApiTags.Get3DModels],
      query: ({ id, thumbnail }) => {
        return {
          method: 'POST',
          url: `${ApiUrls.Get3DModels}/${id}/${ApiUrls.SaveThumbnailBase64}`,
          body: { thumbnail },
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useUpload3DModelMutation,
  useCurrentUser3DModelsQuery,
  useUpdateModel3DMutation,
  useDelete3DModelMutation,
  useModels3DQuery,
  useModel3DQuery,
  useSaveThumbnailFromBase64Mutation,
} = Models3dApi;
