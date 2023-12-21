import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '@/database/entities/resources/category.entity';
import { CgSoftRequest } from '@/modules/common/resources/dto/cg-soft.request';

@Injectable()
export class CategoryRepository extends Repository<CategoryEntity> {
  public constructor(
    @InjectRepository(CategoryEntity)
    private repository: Repository<CategoryEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async createCategory(name: string, description?: string) {
    const entity = new CategoryEntity();

    entity.name = name;
    entity.description = description;

    return this.save(entity);
  }

  public async createManyCategories(data: CgSoftRequest[]): Promise<CategoryEntity[]> {
    const entities: CategoryEntity[] = data.map(({ name }) => {
      const entity = new CategoryEntity();
      entity.name = name;
      return entity;
    });

    return this.save(entities, { chunk: 20 });
  }
}
