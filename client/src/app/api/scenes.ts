import type {
  SceneCreateRequestDto,
  SceneListItemResponseDto,
  SceneLightUpsertDto,
  SceneObjectUpsertDto,
  SceneResponseDto,
  SceneUpdateRequestDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';
import { ApiUrls } from './urls.ts';

export const ScenesApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    scenes: build.query<SceneListItemResponseDto[], { workspaceId?: string; userId?: string; search?: string }>({
      providesTags: (_result, _error, { workspaceId, userId }) => [
        { type: ApiTags.Scenes, id: workspaceId ?? userId ?? 'personal' },
      ],
      query: ({ workspaceId, userId, search }) => ({
        method: 'GET',
        url: ApiUrls.Scenes,
        params: {
          ...(workspaceId ? { workspaceId } : {}),
          ...(userId ? { userId } : {}),
          ...(search ? { search } : {}),
        },
      }),
    }),

    scene: build.query<SceneResponseDto, { sceneId: string }>({
      providesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }],
      query: ({ sceneId }) => ({
        method: 'GET',
        url: `${ApiUrls.Scenes}/${sceneId}`,
      }),
    }),

    createScene: build.mutation<SceneResponseDto, SceneCreateRequestDto>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.Scenes, id: arg.workspaceId ?? 'personal' }],
      query: (body) => ({
        method: 'POST',
        url: ApiUrls.Scenes,
        body,
      }),
    }),

    updateScene: build.mutation<SceneResponseDto, { sceneId: string; body: SceneUpdateRequestDto }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }, ApiTags.Scenes],
      query: ({ sceneId, body }) => ({
        method: 'PATCH',
        url: `${ApiUrls.Scenes}/${sceneId}`,
        body,
      }),
    }),

    deleteScene: build.mutation<void, { sceneId: string; workspaceId?: string }>({
      invalidatesTags: (_result, _error, { workspaceId }) => [{ type: ApiTags.Scenes, id: workspaceId ?? 'personal' }],
      query: ({ sceneId }) => ({
        method: 'DELETE',
        url: `${ApiUrls.Scenes}/${sceneId}`,
      }),
    }),

    addSceneObject: build.mutation<SceneResponseDto, { sceneId: string; body: SceneObjectUpsertDto }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }],
      query: ({ sceneId, body }) => ({
        method: 'POST',
        url: `${ApiUrls.Scenes}/${sceneId}/objects`,
        body,
      }),
    }),

    updateSceneObject: build.mutation<
      SceneResponseDto,
      { sceneId: string; objectId: string; body: Partial<SceneObjectUpsertDto> }
    >({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }],
      query: ({ sceneId, objectId, body }) => ({
        method: 'PATCH',
        url: `${ApiUrls.Scenes}/${sceneId}/objects/${objectId}`,
        body,
      }),
    }),

    removeSceneObject: build.mutation<void, { sceneId: string; objectId: string }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }],
      query: ({ sceneId, objectId }) => ({
        method: 'DELETE',
        url: `${ApiUrls.Scenes}/${sceneId}/objects/${objectId}`,
      }),
    }),

    addSceneLight: build.mutation<SceneResponseDto, { sceneId: string; body: SceneLightUpsertDto }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }],
      query: ({ sceneId, body }) => ({
        method: 'POST',
        url: `${ApiUrls.Scenes}/${sceneId}/lights`,
        body,
      }),
    }),

    updateSceneLight: build.mutation<
      SceneResponseDto,
      { sceneId: string; lightId: string; body: Partial<SceneLightUpsertDto> }
    >({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }],
      query: ({ sceneId, lightId, body }) => ({
        method: 'PATCH',
        url: `${ApiUrls.Scenes}/${sceneId}/lights/${lightId}`,
        body,
      }),
    }),

    removeSceneLight: build.mutation<void, { sceneId: string; lightId: string }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }],
      query: ({ sceneId, lightId }) => ({
        method: 'DELETE',
        url: `${ApiUrls.Scenes}/${sceneId}/lights/${lightId}`,
      }),
    }),

    uploadSceneHdri: build.mutation<void, { sceneId: string; formData: FormData }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }],
      query: ({ sceneId, formData }) => ({
        method: 'POST',
        url: `${ApiUrls.Scenes}/${sceneId}/hdri`,
        body: formData,
      }),
    }),

    uploadSceneThumbnail: build.mutation<SceneResponseDto, { sceneId: string; thumbnail: string }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.Scene, id: sceneId }, ApiTags.Scenes],
      query: ({ sceneId, thumbnail }) => ({
        method: 'POST',
        url: `${ApiUrls.Scenes}/${sceneId}/thumbnail`,
        body: { thumbnail },
      }),
    }),

    cloneScene: build.mutation<SceneListItemResponseDto, { id: string }>({
      invalidatesTags: (result) => [{ type: ApiTags.Scenes, id: result?.workspaceId ?? result?.userId ?? 'personal' }],
      query: ({ id }) => ({
        method: 'POST',
        url: `${ApiUrls.Scenes}/${id}/clone`,
      }),
    }),
  }),
});

export const {
  useScenesQuery,
  useSceneQuery,
  useCreateSceneMutation,
  useUpdateSceneMutation,
  useDeleteSceneMutation,
  useAddSceneObjectMutation,
  useUpdateSceneObjectMutation,
  useRemoveSceneObjectMutation,
  useAddSceneLightMutation,
  useUpdateSceneLightMutation,
  useRemoveSceneLightMutation,
  useUploadSceneHdriMutation,
  useUploadSceneThumbnailMutation,
  useCloneSceneMutation,
} = ScenesApi;
