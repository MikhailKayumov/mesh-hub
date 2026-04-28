import type {
  SceneAnnotationCreateRequestDto,
  SceneAnnotationReorderRequestDto,
  SceneAnnotationResponseDto,
  SceneAnnotationUpdateRequestDto,
  SceneCommentCreateRequestDto,
  SceneCommentResponseDto,
  SceneCommentUpdateRequestDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const SceneReviewsApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    sceneAnnotations: build.query<SceneAnnotationResponseDto[], string>({
      providesTags: (_result, _error, sceneId) => [{ type: ApiTags.SceneAnnotations, id: sceneId }],
      query: (sceneId) => ({
        method: 'GET',
        url: `scenes/${sceneId}/annotations`,
      }),
    }),
    createSceneAnnotation: build.mutation<
      SceneAnnotationResponseDto,
      { sceneId: string; body: SceneAnnotationCreateRequestDto }
    >({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.SceneAnnotations, id: sceneId }],
      query: ({ sceneId, body }) => ({
        method: 'POST',
        url: `scenes/${sceneId}/annotations`,
        body,
      }),
    }),
    updateSceneAnnotation: build.mutation<
      SceneAnnotationResponseDto,
      { sceneId: string; annotationId: string; body: SceneAnnotationUpdateRequestDto }
    >({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.SceneAnnotations, id: sceneId }],
      query: ({ sceneId, annotationId, body }) => ({
        method: 'PATCH',
        url: `scenes/${sceneId}/annotations/${annotationId}`,
        body,
      }),
    }),
    deleteSceneAnnotation: build.mutation<void, { sceneId: string; annotationId: string }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.SceneAnnotations, id: sceneId }],
      query: ({ sceneId, annotationId }) => ({
        method: 'DELETE',
        url: `scenes/${sceneId}/annotations/${annotationId}`,
      }),
    }),
    reorderSceneAnnotations: build.mutation<void, { sceneId: string; body: SceneAnnotationReorderRequestDto }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.SceneAnnotations, id: sceneId }],
      query: ({ sceneId, body }) => ({
        method: 'PUT',
        url: `scenes/${sceneId}/annotations/order`,
        body,
      }),
    }),
    sceneComments: build.query<SceneCommentResponseDto[], string>({
      providesTags: (_result, _error, sceneId) => [{ type: ApiTags.SceneComments, id: sceneId }],
      query: (sceneId) => ({
        method: 'GET',
        url: `scenes/${sceneId}/comments`,
      }),
    }),
    addSceneComment: build.mutation<SceneCommentResponseDto, { sceneId: string; body: SceneCommentCreateRequestDto }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.SceneComments, id: sceneId }],
      query: ({ sceneId, body }) => ({
        method: 'POST',
        url: `scenes/${sceneId}/comments`,
        body,
      }),
    }),
    updateSceneComment: build.mutation<
      SceneCommentResponseDto,
      { sceneId: string; commentId: string; body: SceneCommentUpdateRequestDto }
    >({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.SceneComments, id: sceneId }],
      query: ({ sceneId, commentId, body }) => ({
        method: 'PATCH',
        url: `scenes/${sceneId}/comments/${commentId}`,
        body,
      }),
    }),
    deleteSceneComment: build.mutation<void, { sceneId: string; commentId: string }>({
      invalidatesTags: (_result, _error, { sceneId }) => [{ type: ApiTags.SceneComments, id: sceneId }],
      query: ({ sceneId, commentId }) => ({
        method: 'DELETE',
        url: `scenes/${sceneId}/comments/${commentId}`,
      }),
    }),
  }),
});

export const {
  useSceneAnnotationsQuery,
  useCreateSceneAnnotationMutation,
  useUpdateSceneAnnotationMutation,
  useDeleteSceneAnnotationMutation,
  useReorderSceneAnnotationsMutation,
  useSceneCommentsQuery,
  useAddSceneCommentMutation,
  useUpdateSceneCommentMutation,
  useDeleteSceneCommentMutation,
} = SceneReviewsApi;
