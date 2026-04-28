import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneEntity } from '@/database/entities/scenes/scene.entity';

@Injectable()
export class SceneRepository extends Repository<SceneEntity> {
  public constructor(
    @InjectRepository(SceneEntity)
    private repository: Repository<SceneEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findByUserId(userId: string): Promise<SceneEntity[]> {
    return this.find({
      where: { userId },
      relations: { objects: true },
      order: { createdAt: 'DESC' },
    });
  }
}
