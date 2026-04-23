import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelCommentEntity } from '@/database/entities/models-3d/model-comment.entity';
import { ReviewsController } from '@/modules/reviews/controllers/reviews.controller';
import { ModelCommentRepository } from '@/modules/reviews/repositories/model-comment.repository';
import { ReviewsService } from '@/modules/reviews/services/reviews.service';
import { WorkspacesModule } from '@/modules/workspaces/workspaces.module';

@Module({
  imports: [TypeOrmModule.forFeature([ModelCommentEntity, Model3dEntity]), WorkspacesModule],
  providers: [ModelCommentRepository, ReviewsService],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
