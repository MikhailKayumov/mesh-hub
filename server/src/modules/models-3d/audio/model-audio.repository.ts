import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelAudioEntity } from '@/database/entities/models-3d/model-audio.entity';

@Injectable()
export class ModelAudioRepository {
  public constructor(
    @InjectRepository(ModelAudioEntity)
    private readonly repo: Repository<ModelAudioEntity>,
  ) {}

  public async findByModel(modelId: string): Promise<ModelAudioEntity[]> {
    return this.repo.find({ where: { modelId }, order: { createdAt: 'ASC' } });
  }

  public async findOneByModelAndId(modelId: string, audioId: string): Promise<ModelAudioEntity | null> {
    return this.repo.findOne({ where: { id: audioId, modelId } });
  }

  public async save(entity: ModelAudioEntity): Promise<ModelAudioEntity> {
    return this.repo.save(entity);
  }

  public async create(data: Partial<ModelAudioEntity>): Promise<ModelAudioEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  public async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
