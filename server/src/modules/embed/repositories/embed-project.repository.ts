import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbedProjectEntity } from '@/database/entities/embed/embed-project.entity';

@Injectable()
export class EmbedProjectRepository extends Repository<EmbedProjectEntity> {
  public constructor(
    @InjectRepository(EmbedProjectEntity)
    private readonly repository: Repository<EmbedProjectEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findByModel(modelId: string): Promise<EmbedProjectEntity | null> {
    return this.findOne({
      where: { modelId },
      relations: { domains: true },
      order: { createdAt: 'DESC' },
    });
  }

  public findByScene(sceneId: string): Promise<EmbedProjectEntity | null> {
    return this.findOne({
      where: { sceneId },
      relations: { domains: true },
      order: { createdAt: 'DESC' },
    });
  }

  public findByModelOrScene(targetId: string): Promise<EmbedProjectEntity | null> {
    return this.findOne({
      where: [{ modelId: targetId }, { sceneId: targetId }],
      relations: { domains: true },
      order: { createdAt: 'DESC' },
    });
  }

  public findByOrg(orgId: string): Promise<EmbedProjectEntity[]> {
    return this.find({
      where: { orgId },
      relations: { domains: true },
      order: { createdAt: 'DESC' },
    });
  }

  public findById(id: string): Promise<EmbedProjectEntity | null> {
    return this.findOne({
      where: { id },
      relations: { domains: true },
    });
  }
}
