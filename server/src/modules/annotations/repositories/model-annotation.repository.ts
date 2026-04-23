import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelAnnotationEntity } from '@/database/entities/models-3d/model-annotation.entity';

@Injectable()
export class ModelAnnotationRepository extends Repository<ModelAnnotationEntity> {
  public constructor(
    @InjectRepository(ModelAnnotationEntity)
    private repository: Repository<ModelAnnotationEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findByModelId(modelId: string): Promise<ModelAnnotationEntity[]> {
    return this.find({
      where: { modelId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }
}
