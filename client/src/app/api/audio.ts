import type { ModelAudioResponseDto } from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const AudioApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    listModelAudio: build.query<ModelAudioResponseDto[], { modelId: string }>({
      providesTags: (_result, _error, { modelId }) => [{ type: ApiTags.ModelAudio, id: modelId }],
      query: ({ modelId }) => ({
        method: 'GET',
        url: `models-3d/${modelId}/audio`,
      }),
    }),
    uploadModelAudio: build.mutation<ModelAudioResponseDto, { modelId: string; file: File }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.ModelAudio, id: modelId }],
      query: ({ modelId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          method: 'POST',
          url: `models-3d/${modelId}/audio`,
          body: formData,
        };
      },
    }),
    deleteModelAudio: build.mutation<void, { modelId: string; audioId: string }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.ModelAudio, id: modelId }],
      query: ({ modelId, audioId }) => ({
        method: 'DELETE',
        url: `models-3d/${modelId}/audio/${audioId}`,
      }),
    }),
  }),
});

export const { useListModelAudioQuery, useUploadModelAudioMutation, useDeleteModelAudioMutation } = AudioApi;
