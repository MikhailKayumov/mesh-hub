import type {
  WebhookCreateRequestDto,
  WebhookCreateResponseDto,
  WebhookDeliveryLogDto,
  WebhookResponseDto,
} from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const WebhooksApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getWebhooks: build.query<WebhookResponseDto[], string>({
      providesTags: (_result, _error, orgId) => [{ type: ApiTags.Webhook, id: `LIST-${orgId}` }],
      query: (orgId) => ({
        method: 'GET',
        url: `organizations/${orgId}/webhooks`,
      }),
    }),
    createWebhook: build.mutation<WebhookCreateResponseDto, { orgId: string; dto: WebhookCreateRequestDto }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.Webhook, id: `LIST-${arg.orgId}` }],
      query: ({ orgId, dto }) => ({
        method: 'POST',
        url: `organizations/${orgId}/webhooks`,
        body: dto,
      }),
    }),
    revokeWebhook: build.mutation<void, { orgId: string; webhookId: string }>({
      invalidatesTags: (_result, _error, arg) => [{ type: ApiTags.Webhook, id: `LIST-${arg.orgId}` }],
      query: ({ orgId, webhookId }) => ({
        method: 'DELETE',
        url: `organizations/${orgId}/webhooks/${webhookId}`,
      }),
    }),
    getWebhookDeliveries: build.query<WebhookDeliveryLogDto[], { orgId: string; webhookId: string }>({
      providesTags: (_result, _error, arg) => [{ type: ApiTags.WebhookDeliveries, id: arg.webhookId }],
      query: ({ orgId, webhookId }) => ({
        method: 'GET',
        url: `organizations/${orgId}/webhooks/${webhookId}/deliveries`,
      }),
    }),
  }),
});

export const { useGetWebhooksQuery, useCreateWebhookMutation, useRevokeWebhookMutation, useGetWebhookDeliveriesQuery } =
  WebhooksApi;
