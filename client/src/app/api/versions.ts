import type { ModelVersionResponseDto } from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const VersionsApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    modelVersions: build.query<ModelVersionResponseDto[], { modelId: string }>({
      providesTags: (_result, _error, { modelId }) => [{ type: ApiTags.ModelVersions, id: modelId }],
      query: ({ modelId }) => ({
        method: 'GET',
        url: `models-3d/${modelId}/versions`,
      }),
    }),
    uploadVersion: build.mutation<ModelVersionResponseDto, { modelId: string; formData: FormData }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.ModelVersions, id: modelId }],
      query: ({ modelId, formData }) => ({
        method: 'POST',
        url: `models-3d/${modelId}/versions`,
        body: formData,
      }),
    }),
    activateVersion: build.mutation<ModelVersionResponseDto, { modelId: string; versionId: string }>({
      invalidatesTags: (_result, _error, { modelId }) => [
        { type: ApiTags.ModelVersions, id: modelId },
        { type: ApiTags.Get3DModel, id: modelId },
      ],
      query: ({ modelId, versionId }) => ({
        method: 'POST',
        url: `models-3d/${modelId}/versions/${versionId}/activate`,
      }),
    }),
    deleteVersion: build.mutation<void, { modelId: string; versionId: string }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.ModelVersions, id: modelId }],
      query: ({ modelId, versionId }) => ({
        method: 'DELETE',
        url: `models-3d/${modelId}/versions/${versionId}`,
      }),
    }),
  }),
});

export const { useModelVersionsQuery, useUploadVersionMutation, useActivateVersionMutation, useDeleteVersionMutation } =
  VersionsApi;
