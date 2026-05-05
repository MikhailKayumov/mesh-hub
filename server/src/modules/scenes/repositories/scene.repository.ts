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

  public findScenes(filters: { workspaceId?: string; userId?: string; search?: string }): Promise<SceneEntity[]> {
    const qb = this.createQueryBuilder('scene')
      .leftJoinAndSelect('scene.objects', 'objects')
      .orderBy('scene.createdAt', 'DESC');

    if (filters.workspaceId) {
      qb.andWhere('scene.workspaceId = :workspaceId', { workspaceId: filters.workspaceId });
    }
    if (filters.userId) {
      qb.andWhere('scene.userId = :userId', { userId: filters.userId });
    }

    const term = filters.search?.trim();
    if (term) {
      qb.andWhere('(scene.name ILIKE :search OR scene.description ILIKE :search)', { search: `%${term}%` });
    }

    return qb.getMany();
  }

  public findScenesUsingModel(modelId: string): Promise<SceneEntity[]> {
    return this.createQueryBuilder('scene')
      .innerJoin('scene.objects', 'so', 'so.modelId = :modelId AND so.deletedAt IS NULL', { modelId })
      .leftJoinAndSelect('scene.objects', 'objects')
      .orderBy('scene.createdAt', 'DESC')
      .getMany();
  }

  public findPublicScenes(search?: string): Promise<SceneEntity[]> {
    const qb = this.createQueryBuilder('scene')
      .leftJoinAndSelect('scene.objects', 'objects')
      .where('scene.visibility = :visibility', { visibility: 'public' })
      .orderBy('scene.createdAt', 'DESC')
      .take(48);

    const term = search?.trim();
    if (term) {
      qb.andWhere('(scene.name ILIKE :search OR scene.description ILIKE :search)', { search: `%${term}%` });
    }

    return qb.getMany();
  }
}
