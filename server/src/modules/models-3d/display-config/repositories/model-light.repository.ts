import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelLightEntity } from '@/database/entities/models-3d/model-light.entity';

@Injectable()
export class ModelLightRepository {
  public constructor(
    @InjectRepository(ModelLightEntity)
    private readonly repo: Repository<ModelLightEntity>,
  ) {}

  public async findByModelId(modelId: string): Promise<ModelLightEntity[]> {
    return this.repo.find({ where: { modelId }, order: { createdAt: 'ASC' } });
  }

  public async findOne(id: string, modelId: string): Promise<ModelLightEntity | null> {
    return this.repo.findOne({ where: { id, modelId } });
  }

  public async save(entity: ModelLightEntity): Promise<ModelLightEntity> {
    return this.repo.save(entity);
  }

  public async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  public getRepository(): Repository<ModelLightEntity> {
    return this.repo;
  }
}
