import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelDisplayConfigEntity } from '@/database/entities/models-3d/model-display-config.entity';

@Injectable()
export class DisplayConfigRepository {
  public constructor(
    @InjectRepository(ModelDisplayConfigEntity)
    private readonly repo: Repository<ModelDisplayConfigEntity>,
  ) {}

  public async findByModelId(modelId: string): Promise<ModelDisplayConfigEntity | null> {
    return this.repo.findOne({ where: { modelId } });
  }

  public async createDefault(modelId: string): Promise<ModelDisplayConfigEntity> {
    const entity = this.repo.create({ modelId });
    return this.repo.save(entity);
  }

  public async save(entity: ModelDisplayConfigEntity): Promise<ModelDisplayConfigEntity> {
    return this.repo.save(entity);
  }
}
