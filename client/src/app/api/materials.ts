import type { MaterialOverrideResponseDto, MaterialOverrideUpsertDto } from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const MaterialsApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getMaterials: build.query<MaterialOverrideResponseDto[], { modelId: string }>({
      providesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Materials, id: modelId }],
      query: ({ modelId }) => ({
        method: 'GET',
        url: `models-3d/${modelId}/materials`,
      }),
    }),
    upsertMaterial: build.mutation<
      MaterialOverrideResponseDto,
      { modelId: string; meshName: string; dto: MaterialOverrideUpsertDto }
    >({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Materials, id: modelId }],
      query: ({ modelId, meshName, dto }) => ({
        method: 'PUT',
        url: `models-3d/${modelId}/materials/${encodeURIComponent(meshName)}`,
        body: dto,
      }),
    }),
    deleteMaterial: build.mutation<void, { modelId: string; meshName: string }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Materials, id: modelId }],
      query: ({ modelId, meshName }) => ({
        method: 'DELETE',
        url: `models-3d/${modelId}/materials/${encodeURIComponent(meshName)}`,
      }),
    }),
    uploadMaterialTexture: build.mutation<
      MaterialOverrideResponseDto,
      { modelId: string; meshName: string; type: string; formData: FormData }
    >({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Materials, id: modelId }],
      query: ({ modelId, meshName, type, formData }) => ({
        method: 'POST',
        url: `models-3d/${modelId}/materials/${encodeURIComponent(meshName)}/texture/${type}`,
        body: formData,
      }),
    }),
    deleteMaterialTexture: build.mutation<
      MaterialOverrideResponseDto,
      { modelId: string; meshName: string; type: string }
    >({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Materials, id: modelId }],
      query: ({ modelId, meshName, type }) => ({
        method: 'DELETE',
        url: `models-3d/${modelId}/materials/${encodeURIComponent(meshName)}/texture/${type}`,
      }),
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useUpsertMaterialMutation,
  useDeleteMaterialMutation,
  useUploadMaterialTextureMutation,
  useDeleteMaterialTextureMutation,
} = MaterialsApi;
