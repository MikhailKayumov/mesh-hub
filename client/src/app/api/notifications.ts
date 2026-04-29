import type { NotificationDto, UnreadCountResponseDto } from './dto.ts';
import { Api } from './base.ts';
import { ApiTags } from './tags.ts';

export const NotificationsApi = Api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getNotifications: build.query<NotificationDto[], void>({
      providesTags: [{ type: ApiTags.Notification, id: 'LIST' }],
      query: () => ({
        method: 'GET',
        url: 'notifications',
      }),
    }),
    getUnreadCount: build.query<UnreadCountResponseDto, void>({
      providesTags: [{ type: ApiTags.NotificationCount, id: 'COUNT' }],
      query: () => ({
        method: 'GET',
        url: 'notifications/unread-count',
      }),
    }),
    markNotificationRead: build.mutation<void, { id: string }>({
      invalidatesTags: [
        { type: ApiTags.Notification, id: 'LIST' },
        { type: ApiTags.NotificationCount, id: 'COUNT' },
      ],
      query: ({ id }) => ({
        method: 'PATCH',
        url: `notifications/${id}/read`,
      }),
    }),
    markAllNotificationsRead: build.mutation<void, void>({
      invalidatesTags: [
        { type: ApiTags.Notification, id: 'LIST' },
        { type: ApiTags.NotificationCount, id: 'COUNT' },
      ],
      query: () => ({
        method: 'PATCH',
        url: 'notifications/read-all',
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = NotificationsApi;
