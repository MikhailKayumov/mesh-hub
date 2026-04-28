import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SceneAnnotationEntity } from '@/database/entities/scenes/scene-annotation.entity';
import { SceneAnnotationRepository } from '@/modules/scenes/annotations/repositories/scene-annotation.repository';
import { SceneAnnotationsController } from '@/modules/scenes/annotations/scene-annotations.controller';
import { SceneAnnotationsService } from '@/modules/scenes/annotations/scene-annotations.service';
import { ScenesModule } from '@/modules/scenes/scenes.module';

@Module({
  imports: [TypeOrmModule.forFeature([SceneAnnotationEntity]), ScenesModule],
  providers: [SceneAnnotationsService, SceneAnnotationRepository],
  controllers: [SceneAnnotationsController],
})
export class SceneAnnotationsModule {}
