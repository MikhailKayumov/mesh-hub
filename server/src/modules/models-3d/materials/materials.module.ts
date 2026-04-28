import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelMaterialOverrideEntity } from '@/database/entities/models-3d/model-material-override.entity';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MaterialOverrideRepository } from './material-override.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ModelMaterialOverrideEntity, Model3dEntity])],
  providers: [MaterialsService, MaterialOverrideRepository, Model3dRepository],
  controllers: [MaterialsController],
  exports: [MaterialsService],
})
export class MaterialsModule {}
