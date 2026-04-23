import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneObjectEntity } from '@/database/entities/scenes/scene-object.entity';

@Injectable()
export class SceneObjectRepository extends Repository<SceneObjectEntity> {
  public constructor(
    @InjectRepository(SceneObjectEntity)
    private repository: Repository<SceneObjectEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public countByScene(sceneId: string): Promise<number> {
    return this.count({ where: { sceneId } });
  }
}
