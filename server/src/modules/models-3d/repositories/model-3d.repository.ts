import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';

@Injectable()
export class Model3dRepository extends Repository<Model3dEntity> {
  public constructor(@InjectRepository(Model3dEntity) private repository: Repository<Model3dEntity>) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
