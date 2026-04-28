import { SceneAnnotationEntity } from '@/database/entities/scenes/scene-annotation.entity';
import { SceneAnnotationResponseDto } from '@/modules/scenes/annotations/dto/scene-annotation.response.dto';

export class SceneAnnotationMapper {
  public static toResponse(entity: SceneAnnotationEntity): SceneAnnotationResponseDto {
    return {
      id: entity.id,
      sceneId: entity.sceneId,
      sceneObjectId: entity.sceneObjectId ?? null,
      label: entity.label,
      body: entity.body ?? null,
      pos: { x: entity.posX, y: entity.posY, z: entity.posZ },
      cameraPos:
        entity.cameraPosX != null && entity.cameraPosY != null && entity.cameraPosZ != null
          ? { x: entity.cameraPosX, y: entity.cameraPosY, z: entity.cameraPosZ }
          : null,
      order: entity.order,
      author: {
        id: entity.user.id,
        firstName: entity.user.firstName,
        lastName: entity.user.lastName,
        avatarUrl: entity.user.userMeta?.avatar,
      },
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
