import { NotificationEntity } from '@/database/entities/notifications/notification.entity';
import { NotificationResponseDto } from '../dto/notification.response.dto';

export class InAppNotificationMapper {
  public static toResponse(entity: NotificationEntity): NotificationResponseDto {
    return {
      id: entity.id,
      type: entity.type,
      payload: entity.payload,
      isRead: entity.isRead,
      createdAt: entity.createdAt,
    };
  }
}
