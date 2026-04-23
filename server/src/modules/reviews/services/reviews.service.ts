import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelVisibility } from '@/constants';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelCommentEntity } from '@/database/entities/models-3d/model-comment.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceMemberRole } from '@/database/entities/workspaces/workspace-member.entity';
import { CommentCreateRequestDto } from '@/modules/reviews/dto/comment.create.request.dto';
import { CommentResponseDto } from '@/modules/reviews/dto/comment.response.dto';
import { CommentUpdateRequestDto } from '@/modules/reviews/dto/comment.update.request.dto';
import { CommentMapper } from '@/modules/reviews/mappers/comment.mapper';
import { ModelCommentRepository } from '@/modules/reviews/repositories/model-comment.repository';
import { WorkspaceMemberRepository } from '@/modules/workspaces/repositories/workspace-member.repository';

@Injectable()
export class ReviewsService {
  public constructor(
    private readonly commentRepository: ModelCommentRepository,
    @InjectRepository(Model3dEntity)
    private readonly model3dRepository: Repository<Model3dEntity>,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  public async getComments(modelId: string, user?: UserEntity): Promise<CommentResponseDto[]> {
    const model = await this.findModelOrThrow(modelId);
    await this.assertCanRead(model, user);
    const comments = await this.commentRepository.findByModelId(modelId);
    return comments.map(CommentMapper.toResponse);
  }

  public async addComment(
    modelId: string,
    user: UserEntity,
    dto: CommentCreateRequestDto,
  ): Promise<CommentResponseDto> {
    const model = await this.findModelOrThrow(modelId);
    await this.assertCanRead(model, user);

    const entity = new ModelCommentEntity();
    entity.body = dto.body;
    entity.modelId = modelId;
    entity.authorId = user.id;
    entity.posX = dto.posX;
    entity.posY = dto.posY;
    entity.posZ = dto.posZ;
    entity.parentId = dto.parentId;
    entity.resolved = false;

    const saved = await this.commentRepository.save(entity);
    const loaded = await this.commentRepository.findById(saved.id);
    return CommentMapper.toResponse(loaded!);
  }

  public async updateComment(
    modelId: string,
    commentId: string,
    user: UserEntity,
    dto: CommentUpdateRequestDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment || comment.modelId !== modelId) throw new NotFoundException('Комментарий не найден');

    await this.assertCanModify(comment, user);

    if (dto.body !== undefined) comment.body = dto.body;
    if (dto.resolved !== undefined) comment.resolved = dto.resolved;

    const saved = await this.commentRepository.save(comment);
    return CommentMapper.toResponse(saved);
  }

  public async deleteComment(modelId: string, commentId: string, user: UserEntity): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment || comment.modelId !== modelId) throw new NotFoundException('Комментарий не найден');

    await this.assertCanModify(comment, user);

    const children = await this.commentRepository.findChildrenOf(commentId);
    if (children.length > 0) {
      await this.commentRepository.softRemove(children);
    }
    await this.commentRepository.softRemove(comment);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async findModelOrThrow(modelId: string): Promise<Model3dEntity> {
    const model = await this.model3dRepository.findOne({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Модель не найдена');
    return model;
  }

  /** Public models → open for anyone. Private/unlisted → must be authenticated workspace member. */
  private async assertCanRead(model: Model3dEntity, user?: UserEntity): Promise<void> {
    if (model.visibility === ModelVisibility.Public) return;

    if (!user) throw new ForbiddenException();

    if (model.workspaceId) {
      const member = await this.workspaceMemberRepository.findByWorkspaceAndUser(model.workspaceId, user.id);
      if (!member) throw new ForbiddenException();
    } else {
      // Personal model — only owner can access
      const owner = await this.model3dRepository.findOne({ where: { id: model.id, user: { id: user.id } } });
      if (!owner) throw new ForbiddenException();
    }
  }

  /** Author OR workspace editor/admin can edit/delete. */
  private async assertCanModify(comment: ModelCommentEntity, user: UserEntity): Promise<void> {
    if (comment.authorId === user.id) return;

    const model = await this.model3dRepository.findOne({ where: { id: comment.modelId } });

    if (model?.workspaceId) {
      const member = await this.workspaceMemberRepository.findByWorkspaceAndUser(model.workspaceId, user.id);
      if (member && member.role === WorkspaceMemberRole.Editor) return;
    }

    throw new ForbiddenException();
  }
}
