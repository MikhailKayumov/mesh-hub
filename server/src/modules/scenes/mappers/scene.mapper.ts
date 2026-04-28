import { SceneLightEntity } from '@/database/entities/scenes/scene-light.entity';
import { SceneObjectEntity } from '@/database/entities/scenes/scene-object.entity';
import { SceneEntity } from '@/database/entities/scenes/scene.entity';
import {
  SceneListItemResponseDto,
  SceneLightResponseDto,
  SceneObjectResponseDto,
  SceneResponseDto,
} from '../dto/scene.response.dto';

export class SceneMapper {
  public static toResponse(entity: SceneEntity): SceneResponseDto {
    return {
      id: entity.id,
      workspaceId: entity.workspaceId,
      userId: entity.userId,
      visibility: entity.visibility,
      name: entity.name,
      description: entity.description,
      config: entity.config,
      thumbnailPath: entity.thumbnailPath,
      objects: (entity.objects ?? []).map(SceneMapper.toObjectResponse),
      lights: (entity.lights ?? []).map(SceneMapper.toLightResponse),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? null,
    };
  }

  public static toListItemResponse(entity: SceneEntity): SceneListItemResponseDto {
    return {
      id: entity.id,
      workspaceId: entity.workspaceId,
      userId: entity.userId,
      visibility: entity.visibility,
      name: entity.name,
      description: entity.description,
      thumbnailPath: entity.thumbnailPath,
      objectCount: (entity.objects ?? []).length,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? null,
    };
  }

  public static toObjectResponse(obj: SceneObjectEntity): SceneObjectResponseDto {
    return {
      id: obj.id,
      model: {
        id: obj.model.id,
        name: obj.model.name,
        file: { entryFile: obj.model.file.entryFile },
      },
      posX: obj.posX,
      posY: obj.posY,
      posZ: obj.posZ,
      rotX: obj.rotX,
      rotY: obj.rotY,
      rotZ: obj.rotZ,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      scaleZ: obj.scaleZ,
      order: obj.order,
      createdAt: obj.createdAt,
      animationConfig: obj.animationConfig ?? null,
      audioConfig: obj.audioConfig ?? null,
    };
  }

  public static toLightResponse(light: SceneLightEntity): SceneLightResponseDto {
    return {
      id: light.id,
      type: light.type,
      posX: light.posX,
      posY: light.posY,
      posZ: light.posZ,
      color: light.color,
      intensity: light.intensity,
      castShadow: light.castShadow,
      createdAt: light.createdAt,
    };
  }
}
