import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CgSoftEntity } from '@/database/entities/resources/cg-soft.entity';

@Injectable()
export class CgSoftRepository extends Repository<CgSoftEntity> {
  public constructor(
    @InjectRepository(CgSoftEntity)
    private repository: Repository<CgSoftEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async createCGSoft(name: string, description?: string) {
    const entity = new CgSoftEntity();

    entity.name = name;
    entity.description = description;

    return this.save(entity);
  }
}
