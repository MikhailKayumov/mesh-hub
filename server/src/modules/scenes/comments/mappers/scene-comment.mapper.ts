import { SceneCommentEntity } from '@/database/entities/scenes/scene-comment.entity';
import { SceneCommentResponseDto } from '@/modules/scenes/comments/dto/scene-comment.response.dto';

export class SceneCommentMapper {
  public static toResponse(entity: SceneCommentEntity): SceneCommentResponseDto {
    return {
      id: entity.id,
      sceneId: entity.sceneId,
      body: entity.body,
      resolved: entity.resolved,
      parentId: entity.parentId ?? null,
      author: {
        id: entity.author.id,
        firstName: entity.author.firstName,
        lastName: entity.author.lastName,
        avatarUrl: entity.author.userMeta?.avatar,
      },
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Builds a threaded tree from a flat list of comments.
   * Top-level (parentId == null) entries are returned at the top, with their
   * direct replies nested under each in `replies`.
   */
  public static toThreadedResponse(entities: SceneCommentEntity[]): SceneCommentResponseDto[] {
    const byId = new Map<string, SceneCommentResponseDto>();
    const roots: SceneCommentResponseDto[] = [];

    for (const e of entities) {
      byId.set(e.id, SceneCommentMapper.toResponse(e));
    }

    for (const e of entities) {
      const dto = byId.get(e.id)!;
      if (e.parentId && byId.has(e.parentId)) {
        const parent = byId.get(e.parentId)!;
        if (!parent.replies) parent.replies = [];
        parent.replies.push(dto);
      } else {
        roots.push(dto);
      }
    }

    return roots;
  }
}
