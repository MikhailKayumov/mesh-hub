import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneLightEntity } from '@/database/entities/scenes/scene-light.entity';

@Injectable()
export class SceneLightRepository extends Repository<SceneLightEntity> {
  public constructor(
    @InjectRepository(SceneLightEntity)
    private repository: Repository<SceneLightEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public countByScene(sceneId: string): Promise<number> {
    return this.count({ where: { sceneId } });
  }
}
