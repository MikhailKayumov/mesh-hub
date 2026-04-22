import type {
  OrganizationCreateRequestDto,
  OrganizationUpdateRequestDto,
  OrganizationResponseDto,
  OrgMemberResponseDto,
  OrgInviteCreateRequestDto,
  OrgInviteAcceptRequestDto,
  OrgMemberRoleChangeRequestDto,
  PaginationDto,
  PaginationResponseDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';
import { ApiUrls } from './urls.ts';

export const OrganizationsApi = Api.injectEndpoints({
  endpoints: (build) => ({
    createOrganization: build.mutation<OrganizationResponseDto, OrganizationCreateRequestDto>({
      invalidatesTags: [ApiTags.Organization],
      query: (body) => ({
        method: 'POST',
        url: ApiUrls.Organizations,
        body,
      }),
    }),
    myOrganizations: build.query<OrganizationResponseDto[], void>({
      providesTags: [ApiTags.Organization],
      query: () => ({
        method: 'GET',
        url: `${ApiUrls.Organizations}/current`,
      }),
    }),
    organization: build.query<OrganizationResponseDto, string>({
      providesTags: (_result, _error, id) => [{ type: ApiTags.Organization, id }],
      query: (id) => ({
        method: 'GET',
        url: `${ApiUrls.Organizations}/${id}`,
      }),
    }),
    updateOrganization: build.mutation<OrganizationResponseDto, { id: string; body: OrganizationUpdateRequestDto }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.Organization, id: arg.id }],
      query: ({ id, body }) => ({
        method: 'PATCH',
        url: `${ApiUrls.Organizations}/${id}`,
        body,
      }),
    }),
    orgMembers: build.query<PaginationResponseDto<OrgMemberResponseDto>, { id: string } & PaginationDto>({
      providesTags: (_result, _error, arg) => [{ type: ApiTags.OrgMembers, id: arg.id }],
      query: ({ id, ...params }) => ({
        method: 'GET',
        url: `${ApiUrls.Organizations}/${id}/members`,
        params,
      }),
    }),
    inviteOrgMember: build.mutation<void, { id: string; body: OrgInviteCreateRequestDto }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.OrgMembers, id: arg.id }],
      query: ({ id, body }) => ({
        method: 'POST',
        url: `${ApiUrls.Organizations}/${id}/invite`,
        body,
      }),
    }),
    acceptOrgInvite: build.mutation<void, OrgInviteAcceptRequestDto>({
      query: (body) => ({
        method: 'POST',
        url: `${ApiUrls.Organizations}/invite/accept`,
        body,
      }),
    }),
    changeOrgMemberRole: build.mutation<void, { id: string; userId: string; body: OrgMemberRoleChangeRequestDto }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.OrgMembers, id: arg.id }],
      query: ({ id, userId, body }) => ({
        method: 'PATCH',
        url: `${ApiUrls.Organizations}/${id}/members/${userId}`,
        body,
      }),
    }),
    removeOrgMember: build.mutation<void, { id: string; userId: string }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.OrgMembers, id: arg.id }],
      query: ({ id, userId }) => ({
        method: 'DELETE',
        url: `${ApiUrls.Organizations}/${id}/members/${userId}`,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateOrganizationMutation,
  useMyOrganizationsQuery,
  useOrganizationQuery,
  useUpdateOrganizationMutation,
  useOrgMembersQuery,
  useInviteOrgMemberMutation,
  useAcceptOrgInviteMutation,
  useChangeOrgMemberRoleMutation,
  useRemoveOrgMemberMutation,
} = OrganizationsApi;
