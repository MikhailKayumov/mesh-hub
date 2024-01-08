import { CategoryEntity } from '@/database/entities/resources/category.entity';
import { CategoryResponse } from '@/modules/common/resources/dto/category.response';

export class CategoryMapper {
  public static toResponse(entity: CategoryEntity): CategoryResponse {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
    };
  }
}
