import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model3dFileEntity } from '@/database/entities/models-3d/model-3d-file.entity';

@Injectable()
export class Model3dFileRepository extends Repository<Model3dFileEntity> {
  public constructor(@InjectRepository(Model3dFileEntity) private repository: Repository<Model3dFileEntity>) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
