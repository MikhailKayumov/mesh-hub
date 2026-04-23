import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelAnnotationEntity } from '@/database/entities/models-3d/model-annotation.entity';
import { AnnotationsController } from '@/modules/annotations/controllers/annotations.controller';
import { ModelAnnotationRepository } from '@/modules/annotations/repositories/model-annotation.repository';
import { AnnotationsService } from '@/modules/annotations/services/annotations.service';
import { WorkspacesModule } from '@/modules/workspaces/workspaces.module';

@Module({
  imports: [TypeOrmModule.forFeature([ModelAnnotationEntity, Model3dEntity]), WorkspacesModule],
  providers: [ModelAnnotationRepository, AnnotationsService],
  controllers: [AnnotationsController],
})
export class AnnotationsModule {}
