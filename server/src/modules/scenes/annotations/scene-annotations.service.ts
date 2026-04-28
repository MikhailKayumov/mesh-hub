import { Injectable, NotFoundException } from '@nestjs/common';
import { SceneAnnotationEntity } from '@/database/entities/scenes/scene-annotation.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { SceneAnnotationCreateRequestDto } from '@/modules/scenes/annotations/dto/scene-annotation.create.request.dto';
import { SceneAnnotationReorderItemDto } from '@/modules/scenes/annotations/dto/scene-annotation.reorder.request.dto';
import { SceneAnnotationResponseDto } from '@/modules/scenes/annotations/dto/scene-annotation.response.dto';
import { SceneAnnotationUpdateRequestDto } from '@/modules/scenes/annotations/dto/scene-annotation.update.request.dto';
import { SceneAnnotationMapper } from '@/modules/scenes/annotations/mappers/scene-annotation.mapper';
import { SceneAnnotationRepository } from '@/modules/scenes/annotations/repositories/scene-annotation.repository';
import { ScenesService } from '@/modules/scenes/services/scenes.service';

@Injectable()
export class SceneAnnotationsService {
  public constructor(
    private readonly sceneAnnotationRepository: SceneAnnotationRepository,
    private readonly scenesService: ScenesService,
  ) {}

  public async getAnnotations(sceneId: string, user?: UserEntity): Promise<SceneAnnotationResponseDto[]> {
    await this.scenesService.assertCanReadScene(sceneId, user?.id ?? null);
    const annotations = await this.sceneAnnotationRepository.findBySceneId(sceneId);
    return annotations.map(SceneAnnotationMapper.toResponse);
  }

  public async createAnnotation(
    sceneId: string,
    dto: SceneAnnotationCreateRequestDto,
    user: UserEntity,
  ): Promise<SceneAnnotationResponseDto> {
    await this.scenesService.assertCanWriteScene(sceneId, user.id);

    const entity = new SceneAnnotationEntity();
    entity.sceneId = sceneId;
    entity.userId = user.id;
    entity.label = dto.label;
    entity.body = dto.body ?? null;
    entity.posX = dto.posX;
    entity.posY = dto.posY;
    entity.posZ = dto.posZ;
    entity.cameraPosX = dto.cameraPosX ?? null;
    entity.cameraPosY = dto.cameraPosY ?? null;
    entity.cameraPosZ = dto.cameraPosZ ?? null;
    entity.sceneObjectId = dto.sceneObjectId ?? null;
    entity.order = 0;

    const saved = await this.sceneAnnotationRepository.save(entity);
    const loaded = await this.sceneAnnotationRepository.findById(saved.id);
    return SceneAnnotationMapper.toResponse(loaded!);
  }

  public async updateAnnotation(
    sceneId: string,
    annotationId: string,
    dto: SceneAnnotationUpdateRequestDto,
    user: UserEntity,
  ): Promise<SceneAnnotationResponseDto> {
    await this.scenesService.assertCanWriteScene(sceneId, user.id);

    const annotation = await this.sceneAnnotationRepository.findOne({ where: { id: annotationId, sceneId } });
    if (!annotation) throw new NotFoundException('Scene annotation not found');

    if (dto.label !== undefined) annotation.label = dto.label;
    if (dto.body !== undefined) annotation.body = dto.body;
    if (dto.posX !== undefined) annotation.posX = dto.posX;
    if (dto.posY !== undefined) annotation.posY = dto.posY;
    if (dto.posZ !== undefined) annotation.posZ = dto.posZ;
    if (dto.cameraPosX !== undefined) annotation.cameraPosX = dto.cameraPosX;
    if (dto.cameraPosY !== undefined) annotation.cameraPosY = dto.cameraPosY;
    if (dto.cameraPosZ !== undefined) annotation.cameraPosZ = dto.cameraPosZ;
    if (dto.sceneObjectId !== undefined) annotation.sceneObjectId = dto.sceneObjectId;

    await this.sceneAnnotationRepository.save(annotation);
    const loaded = await this.sceneAnnotationRepository.findById(annotation.id);
    return SceneAnnotationMapper.toResponse(loaded!);
  }

  public async deleteAnnotation(sceneId: string, annotationId: string, user: UserEntity): Promise<void> {
    await this.scenesService.assertCanWriteScene(sceneId, user.id);

    const annotation = await this.sceneAnnotationRepository.findOne({ where: { id: annotationId, sceneId } });
    if (!annotation) throw new NotFoundException('Scene annotation not found');

    await this.sceneAnnotationRepository.softRemove(annotation);
  }

  public async reorderAnnotations(
    sceneId: string,
    items: SceneAnnotationReorderItemDto[],
    user: UserEntity,
  ): Promise<void> {
    await this.scenesService.assertCanWriteScene(sceneId, user.id);
    await this.sceneAnnotationRepository.bulkUpdateOrder(sceneId, items);
  }
}
