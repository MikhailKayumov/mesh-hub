import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '@/database/entities/notifications/notification.entity';
import { InAppNotificationsController } from './controllers/in-app-notifications.controller';
import { EmailGatewayModule } from './gateways/email-gateway/email-gateway.module';
import { NotificationsService } from './notifications.service';
import { InAppNotificationRepository } from './repositories/in-app-notification.repository';
import { InAppNotificationsService } from './services/in-app-notifications.service';

@Global()
@Module({
  imports: [EmailGatewayModule, TypeOrmModule.forFeature([NotificationEntity])],
  providers: [NotificationsService, InAppNotificationsService, InAppNotificationRepository],
  controllers: [InAppNotificationsController],
  exports: [NotificationsService, InAppNotificationsService],
})
export class NotificationsModule {}
