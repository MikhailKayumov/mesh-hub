import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '@/guards/auth/jwt-auth.guard';
import { ThrottlerBehindProxyGuard } from '@/guards/throttler-behind-proxy.guard';
import { CookiesInterceptor } from '@/interceptors/cookies.interceptor';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConfigModule } from '@/modules/common/config/config.module';
import { ConfigService } from '@/modules/common/config/config.service';
import { FileStorageModule } from '@/modules/common/files/file-storage.module';
import { LoggerModule } from '@/modules/common/logger/logger.module';
import { NotificationsModule } from '@/modules/common/notifications/notifications.module';
import { ResourcesModule } from '@/modules/common/resources/resources.module';
import { Models3dModule } from '@/modules/models-3d/models-3d.module';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    NotificationsModule,
    FileStorageModule,
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
    Models3dModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CookiesInterceptor,
    },
  ],
})
export class AppModule {}
