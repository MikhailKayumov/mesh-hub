import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '@/guards/auth/jwt-auth.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConfigModule } from '@/modules/common/config/config.module';
import { ConfigService } from '@/modules/common/config/config.service';
import { LoggerModule } from '@/modules/common/logger/logger.module';
import { NotificationsModule } from '@/modules/common/notifications/notifications.module';
import { ResourcesModule } from '@/modules/common/resources/resources.module';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    NotificationsModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.typeOrmOptions,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.throttlerConfig,
    }),
    ScheduleModule.forRoot(),
    ResourcesModule,
    UserModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
