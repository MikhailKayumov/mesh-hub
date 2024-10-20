import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CgSoftEntity } from '@/database/entities/resources/cg-soft.entity';
import { CgSoftRequest } from '@/modules/resources/dto/cg-soft.request';

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

  public async createManyCGSoft(data: CgSoftRequest[]): Promise<CgSoftEntity[]> {
    const entities: CgSoftEntity[] = data.map(({ name }) => {
      const entity = new CgSoftEntity();
      entity.name = name;
      return entity;
    });

    return this.save(entities, { chunk: 20 });
  }
}
