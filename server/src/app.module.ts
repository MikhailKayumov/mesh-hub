import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '@/guards/auth/jwt-auth.guard';
import { ThrottlerBehindProxyGuard } from '@/guards/throttler-behind-proxy.guard';
import { CookiesInterceptor } from '@/interceptors/cookies.interceptor';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConfigModule } from '@/modules/config/config.module';
import { ConfigService } from '@/modules/config/config.service';
import { FileStorageModule } from '@/modules/files/files.module';
import { Models3dModule } from '@/modules/models-3d/models-3d.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { ResourcesModule } from '@/modules/resources/resources.module';
import { UserModule } from '@/modules/user/user.module';
import { WorkspacesModule } from '@/modules/workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule,
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
    OrganizationsModule,
    WorkspacesModule,
    ApiKeysModule,
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
