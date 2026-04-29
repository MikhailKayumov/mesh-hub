import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SceneLightEntity } from '@/database/entities/scenes/scene-light.entity';
import { SceneObjectEntity } from '@/database/entities/scenes/scene-object.entity';
import { SceneEntity } from '@/database/entities/scenes/scene.entity';
import { FileStorageModule } from '@/modules/files/files.module';
import { WebhooksModule } from '@/modules/organizations/webhooks/webhooks.module';
import { WorkspacesModule } from '@/modules/workspaces/workspaces.module';
import { ScenesController } from './controllers/scenes.controller';
import { SceneLightRepository } from './repositories/scene-light.repository';
import { SceneObjectRepository } from './repositories/scene-object.repository';
import { SceneRepository } from './repositories/scene.repository';
import { ScenesService } from './services/scenes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SceneEntity, SceneObjectEntity, SceneLightEntity]),
    WorkspacesModule,
    FileStorageModule,
    WebhooksModule,
  ],
  providers: [ScenesService, SceneRepository, SceneObjectRepository, SceneLightRepository],
  exports: [ScenesService],
  controllers: [ScenesController],
})
export class ScenesModule {}
