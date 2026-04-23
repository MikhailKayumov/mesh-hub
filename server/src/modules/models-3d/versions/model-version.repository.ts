import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ModelVersionEntity } from '@/database/entities/models-3d/model-version.entity';

@Injectable()
export class ModelVersionRepository {
  public constructor(
    @InjectRepository(ModelVersionEntity)
    private readonly repo: Repository<ModelVersionEntity>,
  ) {}

  public async findByModelId(modelId: string): Promise<ModelVersionEntity[]> {
    return this.repo.find({
      where: { modelId },
      relations: { uploader: { userMeta: true } },
      order: { versionNumber: 'DESC' },
    });
  }

  public async findActive(modelId: string): Promise<ModelVersionEntity | null> {
    return this.repo.findOne({
      where: { modelId, isActive: true },
      relations: { uploader: { userMeta: true } },
    });
  }

  public async findById(versionId: string): Promise<ModelVersionEntity | null> {
    return this.repo.findOne({
      where: { id: versionId },
      relations: { uploader: { userMeta: true } },
    });
  }

  public async findLastVersion(modelId: string, em?: EntityManager): Promise<ModelVersionEntity | null> {
    const repository = em ? em.getRepository(ModelVersionEntity) : this.repo;
    return repository.findOne({
      where: { modelId },
      order: { versionNumber: 'DESC' },
    });
  }

  public getRepository(): Repository<ModelVersionEntity> {
    return this.repo;
  }
}
