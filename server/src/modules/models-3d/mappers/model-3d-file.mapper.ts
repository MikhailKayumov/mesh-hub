import { Model3dFileEntity } from '@/database/entities/models-3d/model-3d-file.entity';
import { Model3dFileResponseDto } from '@/modules/models-3d/dto/model-3d-file.response.dto';

export class Model3dFileMapper {
  public static toModel3DFileResponse(entity: Model3dFileEntity): Model3dFileResponseDto {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      name: entity.name,
      size: entity.size,
      extension: entity.extension,
      entryFile: entity.entryFile ?? entity.name,
      originalFormat: entity.originalFormat,
    };
  }
}
