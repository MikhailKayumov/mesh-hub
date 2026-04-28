import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SceneAnnotationEntity } from '@/database/entities/scenes/scene-annotation.entity';
import { SceneAnnotationReorderItemDto } from '@/modules/scenes/annotations/dto/scene-annotation.reorder.request.dto';

@Injectable()
export class SceneAnnotationRepository extends Repository<SceneAnnotationEntity> {
  public constructor(
    @InjectRepository(SceneAnnotationEntity)
    private readonly repository: Repository<SceneAnnotationEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findBySceneId(sceneId: string): Promise<SceneAnnotationEntity[]> {
    return this.find({
      where: { sceneId },
      relations: { user: { userMeta: true } },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  public findById(id: string): Promise<SceneAnnotationEntity | null> {
    return this.findOne({
      where: { id },
      relations: { user: { userMeta: true } },
    });
  }

  public async bulkUpdateOrder(sceneId: string, items: SceneAnnotationReorderItemDto[]): Promise<void> {
    if (items.length === 0) return;

    const ids = items.map((it) => it.id);
    const existing = await this.find({ where: { id: In(ids), sceneId }, select: ['id'] });
    const allowed = new Set(existing.map((e) => e.id));

    await Promise.all(
      items.filter((it) => allowed.has(it.id)).map((it) => this.update({ id: it.id, sceneId }, { order: it.order })),
    );
  }
}
