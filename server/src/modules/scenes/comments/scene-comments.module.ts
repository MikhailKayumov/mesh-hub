import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SceneCommentEntity } from '@/database/entities/scenes/scene-comment.entity';
import { SceneCommentRepository } from '@/modules/scenes/comments/repositories/scene-comment.repository';
import { SceneCommentsController } from '@/modules/scenes/comments/scene-comments.controller';
import { SceneCommentsService } from '@/modules/scenes/comments/scene-comments.service';
import { ScenesModule } from '@/modules/scenes/scenes.module';

@Module({
  imports: [TypeOrmModule.forFeature([SceneCommentEntity]), ScenesModule],
  providers: [SceneCommentsService, SceneCommentRepository],
  controllers: [SceneCommentsController],
})
export class SceneCommentsModule {}
