import { ModelCommentEntity } from '@/database/entities/models-3d/model-comment.entity';
import { CommentResponseDto } from '@/modules/reviews/dto/comment.response.dto';

export class CommentMapper {
  public static toResponse(entity: ModelCommentEntity): CommentResponseDto {
    return {
      id: entity.id,
      body: entity.body,
      pos:
        entity.posX != null && entity.posY != null && entity.posZ != null
          ? { x: entity.posX, y: entity.posY, z: entity.posZ }
          : null,
      resolved: entity.resolved,
      parentId: entity.parentId ?? null,
      author: {
        id: entity.author.id,
        firstName: entity.author.firstName,
        lastName: entity.author.lastName,
        avatar: entity.author.userMeta?.avatar,
      },
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
