import { CgSoftEntity } from '@/database/entities/resources/cg-soft.entity';
import { CgSoftResponse } from '@/modules/resources/dto/cg-soft.response';

export class CgSoftMapper {
  public static toResponse(entity: CgSoftEntity): CgSoftResponse {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
    };
  }
}
