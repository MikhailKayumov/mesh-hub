import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelAnnotationEntity } from '@/database/entities/models-3d/model-annotation.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceMemberRole } from '@/database/entities/workspaces/workspace-member.entity';
import { AnnotationCreateRequestDto } from '@/modules/annotations/dto/annotation.create.request.dto';
import { AnnotationResponseDto } from '@/modules/annotations/dto/annotation.response.dto';
import { AnnotationUpdateRequestDto } from '@/modules/annotations/dto/annotation.update.request.dto';
import { ModelAnnotationRepository } from '@/modules/annotations/repositories/model-annotation.repository';
import { WorkspaceMemberRepository } from '@/modules/workspaces/repositories/workspace-member.repository';

@Injectable()
export class AnnotationsService {
  public constructor(
    private readonly annotationRepository: ModelAnnotationRepository,
    @InjectRepository(Model3dEntity)
    private readonly model3dRepository: Repository<Model3dEntity>,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  public async getAnnotations(modelId: string): Promise<AnnotationResponseDto[]> {
    await this.findModelOrThrow(modelId);
    const annotations = await this.annotationRepository.findByModelId(modelId);
    return annotations.map(this.toResponse);
  }

  public async createAnnotation(
    modelId: string,
    user: UserEntity,
    dto: AnnotationCreateRequestDto,
  ): Promise<AnnotationResponseDto> {
    const model = await this.findModelOrThrow(modelId);
    await this.assertCanWrite(model, user);

    const entity = new ModelAnnotationEntity();
    entity.modelId = modelId;
    entity.label = dto.label;
    entity.body = dto.body;
    entity.posX = dto.posX;
    entity.posY = dto.posY;
    entity.posZ = dto.posZ;
    entity.cameraPosX = dto.cameraPosX;
    entity.cameraPosY = dto.cameraPosY;
    entity.cameraPosZ = dto.cameraPosZ;
    entity.order = dto.order ?? 0;

    const saved = await this.annotationRepository.save(entity);
    return this.toResponse(saved);
  }

  public async updateAnnotation(
    modelId: string,
    annotationId: string,
    user: UserEntity,
    dto: AnnotationUpdateRequestDto,
  ): Promise<AnnotationResponseDto> {
    const model = await this.findModelOrThrow(modelId);
    await this.assertCanWrite(model, user);

    const annotation = await this.annotationRepository.findOne({ where: { id: annotationId, modelId } });
    if (!annotation) throw new NotFoundException('Аннотация не найдена');

    const updated = this.annotationRepository.merge(annotation, {
      label: dto.label,
      body: dto.body,
      posX: dto.posX,
      posY: dto.posY,
      posZ: dto.posZ,
      cameraPosX: dto.cameraPosX,
      cameraPosY: dto.cameraPosY,
      cameraPosZ: dto.cameraPosZ,
      order: dto.order,
    });

    const saved = await this.annotationRepository.save(updated);
    return this.toResponse(saved);
  }

  public async deleteAnnotation(modelId: string, annotationId: string, user: UserEntity): Promise<void> {
    const model = await this.findModelOrThrow(modelId);
    await this.assertCanWrite(model, user);

    const annotation = await this.annotationRepository.findOne({ where: { id: annotationId, modelId } });
    if (!annotation) throw new NotFoundException('Аннотация не найдена');

    await this.annotationRepository.softRemove(annotation);
  }

  public async reorderAnnotations(modelId: string, user: UserEntity, ids: string[]): Promise<void> {
    const model = await this.findModelOrThrow(modelId);
    await this.assertCanWrite(model, user);

    await Promise.all(ids.map((id, index) => this.annotationRepository.update({ id, modelId }, { order: index })));
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async findModelOrThrow(modelId: string): Promise<Model3dEntity> {
    const model = await this.model3dRepository.findOne({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Модель не найдена');
    return model;
  }

  /**
   * Workspace model → must be workspace member with role ≥ editor.
   * Personal model  → must be model owner.
   */
  private async assertCanWrite(model: Model3dEntity, user: UserEntity): Promise<void> {
    if (model.workspaceId) {
      const member = await this.workspaceMemberRepository.findByWorkspaceAndUser(model.workspaceId, user.id);
      if (!member || member.role !== WorkspaceMemberRole.Editor) throw new ForbiddenException();
    } else {
      const isOwner = await this.model3dRepository.findOne({ where: { id: model.id, user: { id: user.id } } });
      if (!isOwner) throw new ForbiddenException();
    }
  }

  private toResponse(entity: ModelAnnotationEntity): AnnotationResponseDto {
    return {
      id: entity.id,
      label: entity.label,
      body: entity.body,
      pos: { x: entity.posX, y: entity.posY, z: entity.posZ },
      cameraPos:
        entity.cameraPosX != null && entity.cameraPosY != null && entity.cameraPosZ != null
          ? { x: entity.cameraPosX, y: entity.cameraPosY, z: entity.cameraPosZ }
          : null,
      order: entity.order,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
