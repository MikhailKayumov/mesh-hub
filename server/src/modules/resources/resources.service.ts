import { Injectable } from '@nestjs/common';
import { CategoryResponse } from '@/modules/resources/dto/category.response';
import { CgSoftResponse } from '@/modules/resources/dto/cg-soft.response';
import { CategoryMapper } from '@/modules/resources/mappers/category.mapper';
import { CgSoftMapper } from '@/modules/resources/mappers/cg-soft.mapper';
import { CategoryRepository } from '@/modules/resources/repositories/category.repository';
import { CgSoftRepository } from '@/modules/resources/repositories/cg-soft.repository';

@Injectable()
export class ResourcesService {
  public constructor(
    private readonly cgSoftRepository: CgSoftRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async getAllCGSoft(): Promise<CgSoftResponse[]> {
    const entities = await this.cgSoftRepository.find();
    return entities.map(CgSoftMapper.toResponse);
  }

  public async getAllCategories(): Promise<CategoryResponse[]> {
    const entities = await this.categoryRepository.find();
    return entities.map(CategoryMapper.toResponse);
  }
}
