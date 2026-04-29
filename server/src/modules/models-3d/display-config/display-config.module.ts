import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelDisplayConfigEntity } from '@/database/entities/models-3d/model-display-config.entity';
import { ModelLightEntity } from '@/database/entities/models-3d/model-light.entity';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { DisplayConfigController } from './display-config.controller';
import { DisplayConfigService } from './display-config.service';
import { DisplayConfigRepository } from './repositories/display-config.repository';
import { ModelLightRepository } from './repositories/model-light.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ModelDisplayConfigEntity, ModelLightEntity, Model3dEntity])],
  providers: [DisplayConfigService, DisplayConfigRepository, ModelLightRepository, Model3dRepository],
  controllers: [DisplayConfigController],
  exports: [DisplayConfigService, DisplayConfigRepository],
})
export class DisplayConfigModule {}
