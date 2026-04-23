import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelVersionEntity } from '@/database/entities/models-3d/model-version.entity';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { ModelVersionRepository } from './model-version.repository';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModelVersionEntity])],
  providers: [VersionsService, ModelVersionRepository, Model3dRepository],
  controllers: [VersionsController],
  exports: [VersionsService, ModelVersionRepository],
})
export class VersionsModule {}
