import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookDeliveryLogEntity } from '@/database/entities/organizations/webhook-delivery-log.entity';

@Injectable()
export class WebhookDeliveryLogRepository extends Repository<WebhookDeliveryLogEntity> {
  public constructor(
    @InjectRepository(WebhookDeliveryLogEntity)
    private repository: Repository<WebhookDeliveryLogEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public listForWebhook(webhookId: string, limit = 20): Promise<WebhookDeliveryLogEntity[]> {
    return this.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
