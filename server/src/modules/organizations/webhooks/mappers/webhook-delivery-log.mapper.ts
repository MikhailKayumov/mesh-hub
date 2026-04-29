import { WebhookDeliveryLogEntity } from '@/database/entities/organizations/webhook-delivery-log.entity';
import { WebhookDeliveryLogResponseDto } from '../dto/webhook-delivery-log.response.dto';

export class WebhookDeliveryLogMapper {
  public static toResponse(entity: WebhookDeliveryLogEntity): WebhookDeliveryLogResponseDto {
    return {
      id: entity.id,
      event: entity.event,
      responseStatus: entity.responseStatus,
      deliveredAt: entity.deliveredAt,
      failedAt: entity.failedAt,
      createdAt: entity.createdAt,
    };
  }
}
