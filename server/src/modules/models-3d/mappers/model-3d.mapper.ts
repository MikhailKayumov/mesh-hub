import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Model3dResponseDto } from '@/modules/models-3d/dto/model-3d.response.dto';
import { Model3dFileMapper } from '@/modules/models-3d/mappers/model-3d-file.mapper';

export class Model3dMapper {
  public static toModel3DResponse(entity: Model3dEntity, user?: UserEntity): Model3dResponseDto {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      name: entity.name,
      file: Model3dFileMapper.toModel3DFileResponse(entity.file),
      description: entity.description,
      thumbnail: entity.thumbnail,
      categories: entity.categories ?? [],
      isOwner: entity.user.id === user?.id,
      ownerAvatar: entity.user.userMeta.avatar,
      ownerName: `${entity.user.firstName} ${entity.user.lastName}`,
    };
  }
}
