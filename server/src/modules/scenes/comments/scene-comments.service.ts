import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SceneCommentEntity } from '@/database/entities/scenes/scene-comment.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { SceneCommentCreateRequestDto } from '@/modules/scenes/comments/dto/scene-comment.create.request.dto';
import { SceneCommentResponseDto } from '@/modules/scenes/comments/dto/scene-comment.response.dto';
import { SceneCommentUpdateRequestDto } from '@/modules/scenes/comments/dto/scene-comment.update.request.dto';
import { SceneCommentMapper } from '@/modules/scenes/comments/mappers/scene-comment.mapper';
import { SceneCommentRepository } from '@/modules/scenes/comments/repositories/scene-comment.repository';
import { ScenesService } from '@/modules/scenes/services/scenes.service';

@Injectable()
export class SceneCommentsService {
  public constructor(
    private readonly sceneCommentRepository: SceneCommentRepository,
    private readonly scenesService: ScenesService,
  ) {}

  public async getComments(sceneId: string, user?: UserEntity): Promise<SceneCommentResponseDto[]> {
    await this.scenesService.assertCanReadScene(sceneId, user?.id ?? null);
    const comments = await this.sceneCommentRepository.findBySceneId(sceneId);
    return SceneCommentMapper.toThreadedResponse(comments);
  }

  public async addComment(
    sceneId: string,
    dto: SceneCommentCreateRequestDto,
    user: UserEntity,
  ): Promise<SceneCommentResponseDto> {
    await this.scenesService.assertCanReadScene(sceneId, user.id);

    if (dto.parentId) {
      const parent = await this.sceneCommentRepository.findOne({ where: { id: dto.parentId, sceneId } });
      if (!parent) throw new NotFoundException('Parent comment not found');
    }

    const entity = new SceneCommentEntity();
    entity.sceneId = sceneId;
    entity.authorId = user.id;
    entity.body = dto.body;
    entity.parentId = dto.parentId ?? null;
    entity.resolved = false;

    const saved = await this.sceneCommentRepository.save(entity);
    const loaded = await this.sceneCommentRepository.findById(saved.id);
    return SceneCommentMapper.toResponse(loaded!);
  }

  public async updateComment(
    sceneId: string,
    commentId: string,
    dto: SceneCommentUpdateRequestDto,
    user: UserEntity,
  ): Promise<SceneCommentResponseDto> {
    const comment = await this.sceneCommentRepository.findById(commentId);
    if (!comment || comment.sceneId !== sceneId) throw new NotFoundException('Scene comment not found');

    await this.assertCanModify(comment, user);

    if (dto.body !== undefined) comment.body = dto.body;
    if (dto.resolved !== undefined) comment.resolved = dto.resolved;

    const saved = await this.sceneCommentRepository.save(comment);
    return SceneCommentMapper.toResponse(saved);
  }

  public async deleteComment(sceneId: string, commentId: string, user: UserEntity): Promise<void> {
    const comment = await this.sceneCommentRepository.findOne({ where: { id: commentId, sceneId } });
    if (!comment) throw new NotFoundException('Scene comment not found');

    await this.assertCanModify(comment, user);

    const children = await this.sceneCommentRepository.findChildrenOf(commentId);
    if (children.length > 0) {
      await this.sceneCommentRepository.softRemove(children);
    }
    await this.sceneCommentRepository.softRemove(comment);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Author OR workspace editor can edit/delete. */
  private async assertCanModify(comment: SceneCommentEntity, user: UserEntity): Promise<void> {
    if (comment.authorId === user.id) return;

    const scene = await this.scenesService.loadSceneOrThrow(comment.sceneId);

    if (scene.workspaceId) {
      const isEditor = await this.scenesService.isWorkspaceEditor(scene.workspaceId, user.id);
      if (isEditor) return;
    } else if (scene.userId === user.id) {
      return;
    }

    throw new ForbiddenException('Access denied');
  }
}
