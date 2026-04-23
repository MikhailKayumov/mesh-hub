import type {
  AnnotationCreateRequestDto,
  AnnotationReorderRequestDto,
  AnnotationResponseDto,
  AnnotationUpdateRequestDto,
  CommentCreateRequestDto,
  CommentResponseDto,
  CommentUpdateRequestDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const ReviewsApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    modelComments: build.query<CommentResponseDto[], { modelId: string }>({
      providesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Comments, id: modelId }],
      query: ({ modelId }) => ({
        method: 'GET',
        url: `models-3d/${modelId}/comments`,
      }),
    }),
    addComment: build.mutation<CommentResponseDto, { modelId: string; body: CommentCreateRequestDto }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Comments, id: modelId }],
      query: ({ modelId, body }) => ({
        method: 'POST',
        url: `models-3d/${modelId}/comments`,
        body,
      }),
    }),
    updateComment: build.mutation<
      CommentResponseDto,
      { modelId: string; commentId: string; body: CommentUpdateRequestDto }
    >({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Comments, id: modelId }],
      query: ({ modelId, commentId, body }) => ({
        method: 'PATCH',
        url: `models-3d/${modelId}/comments/${commentId}`,
        body,
      }),
    }),
    deleteComment: build.mutation<void, { modelId: string; commentId: string }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Comments, id: modelId }],
      query: ({ modelId, commentId }) => ({
        method: 'DELETE',
        url: `models-3d/${modelId}/comments/${commentId}`,
      }),
    }),
    modelAnnotations: build.query<AnnotationResponseDto[], { modelId: string }>({
      providesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Annotations, id: modelId }],
      query: ({ modelId }) => ({
        method: 'GET',
        url: `models-3d/${modelId}/annotations`,
      }),
    }),
    createAnnotation: build.mutation<AnnotationResponseDto, { modelId: string; body: AnnotationCreateRequestDto }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Annotations, id: modelId }],
      query: ({ modelId, body }) => ({
        method: 'POST',
        url: `models-3d/${modelId}/annotations`,
        body,
      }),
    }),
    updateAnnotation: build.mutation<
      AnnotationResponseDto,
      { modelId: string; id: string; body: AnnotationUpdateRequestDto }
    >({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Annotations, id: modelId }],
      query: ({ modelId, id, body }) => ({
        method: 'PATCH',
        url: `models-3d/${modelId}/annotations/${id}`,
        body,
      }),
    }),
    deleteAnnotation: build.mutation<void, { modelId: string; id: string }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Annotations, id: modelId }],
      query: ({ modelId, id }) => ({
        method: 'DELETE',
        url: `models-3d/${modelId}/annotations/${id}`,
      }),
    }),
    reorderAnnotations: build.mutation<void, { modelId: string; body: AnnotationReorderRequestDto }>({
      invalidatesTags: (_result, _error, { modelId }) => [{ type: ApiTags.Annotations, id: modelId }],
      query: ({ modelId, body }) => ({
        method: 'PUT',
        url: `models-3d/${modelId}/annotations/reorder`,
        body,
      }),
    }),
  }),
});

export const {
  useModelCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useModelAnnotationsQuery,
  useCreateAnnotationMutation,
  useUpdateAnnotationMutation,
  useDeleteAnnotationMutation,
  useReorderAnnotationsMutation,
} = ReviewsApi;
