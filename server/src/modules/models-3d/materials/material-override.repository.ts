import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelMaterialOverrideEntity } from '@/database/entities/models-3d/model-material-override.entity';

@Injectable()
export class MaterialOverrideRepository {
  public constructor(
    @InjectRepository(ModelMaterialOverrideEntity)
    private readonly repo: Repository<ModelMaterialOverrideEntity>,
  ) {}

  public getRepository(): Repository<ModelMaterialOverrideEntity> {
    return this.repo;
  }

  public async findByModelId(modelId: string): Promise<ModelMaterialOverrideEntity[]> {
    return this.repo.find({ where: { modelId } });
  }

  public async findByModelAndMesh(modelId: string, meshName: string): Promise<ModelMaterialOverrideEntity | null> {
    return this.repo.findOne({ where: { modelId, meshName } });
  }

  public async save(entity: ModelMaterialOverrideEntity): Promise<ModelMaterialOverrideEntity> {
    return this.repo.save(entity);
  }

  public async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
