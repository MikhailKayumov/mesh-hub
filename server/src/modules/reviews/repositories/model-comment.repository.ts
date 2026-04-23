import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelCommentEntity } from '@/database/entities/models-3d/model-comment.entity';

@Injectable()
export class ModelCommentRepository extends Repository<ModelCommentEntity> {
  public constructor(
    @InjectRepository(ModelCommentEntity)
    private repository: Repository<ModelCommentEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findByModelId(modelId: string): Promise<ModelCommentEntity[]> {
    return this.find({
      where: { modelId },
      relations: { author: { userMeta: true } },
      order: { createdAt: 'ASC' },
      withDeleted: false,
    });
  }

  public findById(id: string): Promise<ModelCommentEntity | null> {
    return this.findOne({
      where: { id },
      relations: { author: { userMeta: true } },
    });
  }

  public findChildrenOf(parentId: string): Promise<ModelCommentEntity[]> {
    return this.find({ where: { parentId } });
  }
}
