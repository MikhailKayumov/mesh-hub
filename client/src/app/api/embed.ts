import type {
  EmbedProjectResponseDto,
  EmbedProjectCreateRequestDto,
  EmbedProjectUpdateRequestDto,
  EmbedViewerResponseDto,
  ViewAnalyticsResponseDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';
import { ApiUrls } from './urls.ts';

export const EmbedApi = Api.injectEndpoints({
  endpoints: (build) => ({
    embedViewer: build.query<EmbedViewerResponseDto, { modelId: string; apiKey: string }>({
      query: ({ modelId, apiKey }) => ({
        method: 'GET',
        url: `${ApiUrls.Embed}/${modelId}`,
        headers: { 'X-Api-Key': apiKey },
      }),
    }),
    embedProjects: build.query<EmbedProjectResponseDto[], string>({
      providesTags: (_result, _error, orgId) => [{ type: ApiTags.EmbedProjects, id: orgId }],
      query: (orgId) => ({
        method: 'GET',
        url: `${ApiUrls.Embed}/projects`,
        params: { orgId },
      }),
    }),
    createEmbedProject: build.mutation<EmbedProjectResponseDto, EmbedProjectCreateRequestDto>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.EmbedProjects, id: arg.orgId }],
      query: (body) => ({
        method: 'POST',
        url: `${ApiUrls.Embed}/projects`,
        body,
      }),
    }),
    updateEmbedProject: build.mutation<EmbedProjectResponseDto, { id: string; body: EmbedProjectUpdateRequestDto }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.EmbedProject, id: arg.id }],
      query: ({ id, body }) => ({
        method: 'PATCH',
        url: `${ApiUrls.Embed}/projects/${id}`,
        body,
      }),
    }),
    addEmbedDomain: build.mutation<EmbedProjectResponseDto, { id: string; domain: string }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.EmbedProject, id: arg.id }],
      query: ({ id, domain }) => ({
        method: 'POST',
        url: `${ApiUrls.Embed}/projects/${id}/domains`,
        body: { domain },
      }),
    }),
    removeEmbedDomain: build.mutation<void, { id: string; domain: string }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.EmbedProject, id: arg.id }],
      query: ({ id, domain }) => ({
        method: 'DELETE',
        url: `${ApiUrls.Embed}/projects/${id}/domains/${encodeURIComponent(domain)}`,
      }),
    }),
    embedAnalytics: build.query<ViewAnalyticsResponseDto, string>({
      providesTags: (_result, _error, id) => [{ type: ApiTags.EmbedProject, id }],
      query: (id) => ({
        method: 'GET',
        url: `${ApiUrls.Embed}/projects/${id}/analytics`,
      }),
    }),
    uploadEmbedLogo: build.mutation<EmbedProjectResponseDto, { id: string; file: File }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.EmbedProject, id: arg.id }],
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          method: 'POST',
          url: `${ApiUrls.Embed}/projects/${id}/logo`,
          body: formData,
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useEmbedViewerQuery,
  useEmbedProjectsQuery,
  useCreateEmbedProjectMutation,
  useUpdateEmbedProjectMutation,
  useAddEmbedDomainMutation,
  useRemoveEmbedDomainMutation,
  useEmbedAnalyticsQuery,
  useUploadEmbedLogoMutation,
} = EmbedApi;
