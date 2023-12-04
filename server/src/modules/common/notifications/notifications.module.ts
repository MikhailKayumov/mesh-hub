import { Global, Module } from '@nestjs/common';
import { EmailGatewayModule } from './gateways/email-gateway/email-gateway.module';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  imports: [EmailGatewayModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
