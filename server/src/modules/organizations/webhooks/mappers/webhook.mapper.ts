import { WebhookEntity } from '@/database/entities/organizations/webhook.entity';
import { WebhookCreateResponseDto } from '../dto/webhook.create.response.dto';
import { WebhookResponseDto } from '../dto/webhook.response.dto';

export class WebhookMapper {
  public static toResponse(entity: WebhookEntity): WebhookResponseDto {
    return {
      id: entity.id,
      url: entity.url,
      events: entity.events,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    };
  }

  public static toCreateResponse(entity: WebhookEntity, rawSecret: string): WebhookCreateResponseDto {
    return {
      ...WebhookMapper.toResponse(entity),
      secret: rawSecret,
    };
  }
}
