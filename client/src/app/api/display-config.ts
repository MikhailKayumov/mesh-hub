import type {
  DisplayConfigResponseDto,
  DisplayConfigUpdateDto,
  ModelLightResponseDto,
  ModelLightUpdateDto,
  ModelLightUpsertDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const DisplayConfigApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getDisplayConfig: build.query<DisplayConfigResponseDto, { modelId: string }>({
      providesTags: (_result, _error, { modelId }) => [{ type: ApiTags.DisplayConfig, id: modelId }],
      query: ({ modelId }) => ({
        method: 'GET',
        url: `models-3d/${modelId}/display-config`,
      }),
    }),
    updateDisplayConfig: build.mutation<DisplayConfigResponseDto, { modelId: string; dto: DisplayConfigUpdateDto }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.DisplayConfig, id: modelId }],
      query: ({ modelId, dto }) => ({
        method: 'PATCH',
        url: `models-3d/${modelId}/display-config`,
        body: dto,
      }),
    }),
    uploadDisplayHdri: build.mutation<DisplayConfigResponseDto, { modelId: string; formData: FormData }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.DisplayConfig, id: modelId }],
      query: ({ modelId, formData }) => ({
        method: 'POST',
        url: `models-3d/${modelId}/display-config/hdri`,
        body: formData,
      }),
    }),
    removeDisplayHdri: build.mutation<DisplayConfigResponseDto, { modelId: string }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.DisplayConfig, id: modelId }],
      query: ({ modelId }) => ({
        method: 'DELETE',
        url: `models-3d/${modelId}/display-config/hdri`,
      }),
    }),
    addModelLight: build.mutation<ModelLightResponseDto, { modelId: string; dto: ModelLightUpsertDto }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.DisplayConfig, id: modelId }],
      query: ({ modelId, dto }) => ({
        method: 'POST',
        url: `models-3d/${modelId}/display-config/lights`,
        body: dto,
      }),
    }),
    updateModelLight: build.mutation<
      ModelLightResponseDto,
      { modelId: string; lightId: string; dto: ModelLightUpdateDto }
    >({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.DisplayConfig, id: modelId }],
      query: ({ modelId, lightId, dto }) => ({
        method: 'PATCH',
        url: `models-3d/${modelId}/display-config/lights/${lightId}`,
        body: dto,
      }),
    }),
    removeModelLight: build.mutation<void, { modelId: string; lightId: string }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.DisplayConfig, id: modelId }],
      query: ({ modelId, lightId }) => ({
        method: 'DELETE',
        url: `models-3d/${modelId}/display-config/lights/${lightId}`,
      }),
    }),
  }),
});

export const {
  useGetDisplayConfigQuery,
  useUpdateDisplayConfigMutation,
  useUploadDisplayHdriMutation,
  useRemoveDisplayHdriMutation,
  useAddModelLightMutation,
  useUpdateModelLightMutation,
  useRemoveModelLightMutation,
} = DisplayConfigApi;
