import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationTypes } from '@/database/entities/notifications/notification.entity';
import { SceneCommentEntity } from '@/database/entities/scenes/scene-comment.entity';
import { SceneEntity } from '@/database/entities/scenes/scene.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { InAppNotificationsService } from '@/modules/notifications/services/in-app-notifications.service';
import { WebhookDeliveryService } from '@/modules/organizations/webhooks/services/webhook-delivery.service';
import { SceneCommentCreateRequestDto } from '@/modules/scenes/comments/dto/scene-comment.create.request.dto';
import { SceneCommentResponseDto } from '@/modules/scenes/comments/dto/scene-comment.response.dto';
import { SceneCommentUpdateRequestDto } from '@/modules/scenes/comments/dto/scene-comment.update.request.dto';
import { SceneCommentMapper } from '@/modules/scenes/comments/mappers/scene-comment.mapper';
import { SceneCommentRepository } from '@/modules/scenes/comments/repositories/scene-comment.repository';
import { ScenesService } from '@/modules/scenes/services/scenes.service';

@Injectable()
export class SceneCommentsService {
  private readonly logger = new Logger(SceneCommentsService.name);

  public constructor(
    private readonly sceneCommentRepository: SceneCommentRepository,
    private readonly scenesService: ScenesService,
    private readonly inAppNotificationsService: InAppNotificationsService,
    private readonly webhookDeliveryService: WebhookDeliveryService,
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

    void this.fireCommentTriggers(sceneId, saved.id, user.id);

    return SceneCommentMapper.toResponse(loaded!);
  }

  /** Fire-and-forget: notify scene owner (personal scenes only) + dispatch org webhook. */
  private async fireCommentTriggers(sceneId: string, commentId: string, authorId: string): Promise<void> {
    let scene: SceneEntity;
    try {
      scene = await this.scenesService.loadSceneOrThrow(sceneId);
    } catch (err) {
      this.logger.warn(`Failed to load scene for comment triggers ${sceneId}: ${String(err)}`);
      return;
    }

    if (scene.userId && scene.userId !== authorId) {
      try {
        await this.inAppNotificationsService.create(scene.userId, NotificationTypes.CommentAdded, {
          sceneId,
          commentId,
          authorId,
        });
      } catch (err) {
        this.logger.warn(`Failed to dispatch scene comment notification for scene ${sceneId}: ${String(err)}`);
      }
    }

    if (scene.workspaceId) {
      try {
        const orgId = await this.scenesService.resolveWorkspaceOrgId(scene.workspaceId);
        if (orgId) {
          await this.webhookDeliveryService.dispatch(orgId, 'comment.added', {
            sceneId,
            commentId,
            authorId,
          });
        }
      } catch (err) {
        this.logger.warn(`Failed to dispatch scene comment webhook for scene ${sceneId}: ${String(err)}`);
      }
    }
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
