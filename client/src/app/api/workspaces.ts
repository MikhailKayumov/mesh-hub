import type {
  WorkspaceCreateRequestDto,
  WorkspaceUpdateRequestDto,
  WorkspaceResponseDto,
  WorkspaceMemberAddRequestDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';
import { ApiUrls } from './urls.ts';

export const WorkspacesApi = Api.injectEndpoints({
  endpoints: (build) => ({
    createWorkspace: build.mutation<WorkspaceResponseDto, WorkspaceCreateRequestDto>({
      invalidatesTags: [ApiTags.Workspaces],
      query: (body) => ({
        method: 'POST',
        url: ApiUrls.Workspaces,
        body,
      }),
    }),
    myWorkspaces: build.query<WorkspaceResponseDto[], { orgId?: string }>({
      providesTags: [ApiTags.Workspaces],
      query: (params) => ({
        method: 'GET',
        url: ApiUrls.Workspaces,
        params,
      }),
    }),
    workspace: build.query<WorkspaceResponseDto, string>({
      providesTags: (_result, _error, id) => [{ type: ApiTags.Workspace, id }],
      query: (id) => ({
        method: 'GET',
        url: `${ApiUrls.Workspaces}/${id}`,
      }),
    }),
    updateWorkspace: build.mutation<WorkspaceResponseDto, { id: string; body: WorkspaceUpdateRequestDto }>({
      invalidatesTags: [ApiTags.Workspaces],
      query: ({ id, body }) => ({
        method: 'PATCH',
        url: `${ApiUrls.Workspaces}/${id}`,
        body,
      }),
    }),
    deleteWorkspace: build.mutation<void, string>({
      invalidatesTags: [ApiTags.Workspaces],
      query: (id) => ({
        method: 'DELETE',
        url: `${ApiUrls.Workspaces}/${id}`,
      }),
    }),
    addWorkspaceMember: build.mutation<void, { id: string; body: WorkspaceMemberAddRequestDto }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.Workspace, id: arg.id }],
      query: ({ id, body }) => ({
        method: 'POST',
        url: `${ApiUrls.Workspaces}/${id}/members`,
        body,
      }),
    }),
    removeWorkspaceMember: build.mutation<void, { id: string; userId: string }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.Workspace, id: arg.id }],
      query: ({ id, userId }) => ({
        method: 'DELETE',
        url: `${ApiUrls.Workspaces}/${id}/members/${userId}`,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateWorkspaceMutation,
  useMyWorkspacesQuery,
  useWorkspaceQuery,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useAddWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
} = WorkspacesApi;
