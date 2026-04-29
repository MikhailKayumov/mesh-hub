import { HttpStatus, Injectable } from '@nestjs/common';
import {
  NotificationEntity,
  NotificationPayload,
  NotificationType,
} from '@/database/entities/notifications/notification.entity';
import { AppHttpException } from '@/exceptions/app-http.exception';
import { NotificationResponseDto, UnreadCountResponseDto } from '../dto/notification.response.dto';
import { InAppNotificationMapper } from '../mappers/in-app-notification.mapper';
import { InAppNotificationRepository } from '../repositories/in-app-notification.repository';

@Injectable()
export class InAppNotificationsService {
  public constructor(private readonly repository: InAppNotificationRepository) {}

  public async create(
    userId: string,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<NotificationEntity> {
    const entity = new NotificationEntity();
    entity.userId = userId;
    entity.type = type;
    entity.payload = payload;
    entity.isRead = false;
    return this.repository.save(entity);
  }

  public async listForUser(userId: string): Promise<NotificationResponseDto[]> {
    const items = await this.repository.findForUser(userId, 50);
    return items.map(InAppNotificationMapper.toResponse);
  }

  public async markRead(id: string, userId: string): Promise<void> {
    const found = await this.repository.findOneOwned(id, userId);
    if (!found) {
      throw new AppHttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    if (found.isRead) return;
    await this.repository.markRead(id, userId);
  }

  public async markAllRead(userId: string): Promise<void> {
    await this.repository.markAllRead(userId);
  }

  public async unreadCount(userId: string): Promise<UnreadCountResponseDto> {
    const count = await this.repository.countUnread(userId);
    return { count };
  }
}
