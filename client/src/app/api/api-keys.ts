import type { ApiKeyCreateRequestDto, ApiKeyResponseDto } from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const ApiKeysApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getApiKeys: build.query<ApiKeyResponseDto[], string>({
      providesTags: (_result, _error, orgId) => [{ type: ApiTags.ApiKey, id: `LIST-${orgId}` }],
      query: (orgId) => ({
        method: 'GET',
        url: 'api-keys',
        params: { orgId },
      }),
    }),
    createApiKey: build.mutation<ApiKeyResponseDto, { orgId: string; dto: ApiKeyCreateRequestDto }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.ApiKey, id: `LIST-${arg.orgId}` }],
      query: ({ dto }) => ({
        method: 'POST',
        url: 'api-keys',
        body: dto,
      }),
    }),
    revokeApiKey: build.mutation<void, { orgId: string; keyId: string }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.ApiKey, id: `LIST-${arg.orgId}` }],
      query: ({ orgId, keyId }) => ({
        method: 'DELETE',
        url: `api-keys/${keyId}`,
        params: { orgId },
      }),
    }),
  }),
});

export const { useGetApiKeysQuery, useCreateApiKeyMutation, useRevokeApiKeyMutation } = ApiKeysApi;
