import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@/modules/common/config/config.service';
import { EmailGatewayService } from './email-gateway.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.mailerConfig,
    }),
  ],
  providers: [EmailGatewayService],
  exports: [EmailGatewayService],
})
export class EmailGatewayModule {}
