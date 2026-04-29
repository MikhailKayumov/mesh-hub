import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookDeliveryLogEntity } from '@/database/entities/organizations/webhook-delivery-log.entity';
import { WebhookEntity } from '@/database/entities/organizations/webhook.entity';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhookProcessor } from './processors/webhook.processor';
import { WebhookDeliveryLogRepository } from './repositories/webhook-delivery-log.repository';
import { WebhookRepository } from './repositories/webhook.repository';
import { WebhookCryptoService } from './services/webhook-crypto.service';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import { WebhooksService } from './services/webhooks.service';
import { WEBHOOK_QUEUE } from './webhooks.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEntity, WebhookDeliveryLogEntity]),
    BullModule.registerQueue({ name: WEBHOOK_QUEUE }),
    OrganizationsModule,
  ],
  providers: [
    WebhookRepository,
    WebhookDeliveryLogRepository,
    WebhookCryptoService,
    WebhooksService,
    WebhookDeliveryService,
    WebhookProcessor,
  ],
  controllers: [WebhooksController],
  exports: [WebhookDeliveryService],
})
export class WebhooksModule {}
