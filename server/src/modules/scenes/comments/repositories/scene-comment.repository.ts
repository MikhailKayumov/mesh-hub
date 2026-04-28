import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneCommentEntity } from '@/database/entities/scenes/scene-comment.entity';

@Injectable()
export class SceneCommentRepository extends Repository<SceneCommentEntity> {
  public constructor(
    @InjectRepository(SceneCommentEntity)
    private readonly repository: Repository<SceneCommentEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findBySceneId(sceneId: string): Promise<SceneCommentEntity[]> {
    return this.find({
      where: { sceneId },
      relations: { author: { userMeta: true } },
      order: { createdAt: 'ASC' },
      withDeleted: false,
    });
  }

  public findById(id: string): Promise<SceneCommentEntity | null> {
    return this.findOne({
      where: { id },
      relations: { author: { userMeta: true } },
    });
  }

  public findChildrenOf(parentId: string): Promise<SceneCommentEntity[]> {
    return this.find({ where: { parentId } });
  }
}
