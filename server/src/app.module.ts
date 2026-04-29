import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '@/guards/auth/jwt-auth.guard';
import { ThrottlerBehindProxyGuard } from '@/guards/throttler-behind-proxy.guard';
import { CookiesInterceptor } from '@/interceptors/cookies.interceptor';
import { AnnotationsModule } from '@/modules/annotations/annotations.module';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ConfigModule } from '@/modules/config/config.module';
import { ConfigService } from '@/modules/config/config.service';
import { EmbedModule } from '@/modules/embed/embed.module';
import { FileStorageModule } from '@/modules/files/files.module';
import { Models3dModule } from '@/modules/models-3d/models-3d.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { WebhooksModule } from '@/modules/organizations/webhooks/webhooks.module';
import { ResourcesModule } from '@/modules/resources/resources.module';
import { ReviewsModule } from '@/modules/reviews/reviews.module';
import { SceneAnnotationsModule } from '@/modules/scenes/annotations/scene-annotations.module';
import { SceneCommentsModule } from '@/modules/scenes/comments/scene-comments.module';
import { ScenesModule } from '@/modules/scenes/scenes.module';
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
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          username: config.redis.username || undefined,
          password: config.redis.password || undefined,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    ResourcesModule,
    UserModule,
    AuthModule,
    Models3dModule,
    OrganizationsModule,
    WebhooksModule,
    WorkspacesModule,
    ApiKeysModule,
    EmbedModule,
    ReviewsModule,
    AnnotationsModule,
    ScenesModule,
    SceneAnnotationsModule,
    SceneCommentsModule,
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
