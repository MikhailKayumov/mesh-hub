import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Model3dFileEntity } from '@/database/entities/models-3d/model-3d-file.entity';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { Model3dController } from '@/modules/models-3d/controllers/model-3d.controller';
import { Model3dFileRepository } from '@/modules/models-3d/repositories/model-3d-file.repository';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { Model3dService } from '@/modules/models-3d/services/model-3d.service';

@Module({
  imports: [TypeOrmModule.forFeature([Model3dEntity, Model3dFileEntity])],
  providers: [Model3dService, Model3dRepository, Model3dFileRepository],
  exports: [Model3dService, Model3dRepository, Model3dFileRepository],
  controllers: [Model3dController],
})
export class Models3dModule {}
