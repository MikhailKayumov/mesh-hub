import { createReadStream } from 'fs';
import { resolve } from 'path';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SCENE_LIMITS } from '@/constants/plan-limits';
import { PlanType, OrganizationEntity } from '@/database/entities/organizations/organization.entity';
import { SceneEntity } from '@/database/entities/scenes/scene.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { FilesService } from '@/modules/files/files.service';
import { WorkspaceMemberRepository } from '@/modules/workspaces/repositories/workspace-member.repository';
import { SceneLightUpsertDto } from '../dto/scene-light.upsert.dto';
import { SceneObjectUpsertDto } from '../dto/scene-object.upsert.dto';
import { SceneCreateRequestDto } from '../dto/scene.create.request.dto';
import { SceneListItemResponseDto, SceneResponseDto } from '../dto/scene.response.dto';
import { SceneUpdateRequestDto } from '../dto/scene.update.request.dto';
import { SceneMapper } from '../mappers/scene.mapper';
import { SceneLightRepository } from '../repositories/scene-light.repository';
import { SceneObjectRepository } from '../repositories/scene-object.repository';
import { SceneRepository } from '../repositories/scene.repository';

@Injectable()
export class ScenesService {
  private readonly logger = new Logger(ScenesService.name);

  public constructor(
    private readonly sceneRepository: SceneRepository,
    private readonly sceneObjectRepository: SceneObjectRepository,
    private readonly sceneLightRepository: SceneLightRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly filesService: FilesService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // ---------------------------------------------------------------------------
  // Scene CRUD
  // ---------------------------------------------------------------------------

  public async createScene(user: UserEntity, dto: SceneCreateRequestDto): Promise<SceneResponseDto> {
    if (dto.workspaceId) {
      await this.requireMember(dto.workspaceId, user.id);
    }

    const scene = this.sceneRepository.create({
      workspaceId: dto.workspaceId ?? null,
      userId: dto.workspaceId ? null : user.id,
      name: dto.name,
      description: dto.description ?? null,
      config: null,
    });
    const saved = await this.sceneRepository.save(scene);
    saved.objects = [];
    saved.lights = [];
    return SceneMapper.toResponse(saved);
  }

  public async listScenes(
    query: { workspaceId?: string; userId?: string },
    user: UserEntity,
  ): Promise<SceneListItemResponseDto[]> {
    if (query.workspaceId) {
      await this.requireMember(query.workspaceId, user.id);
      const scenes = await this.sceneRepository.find({
        where: { workspaceId: query.workspaceId },
        relations: { objects: true },
        order: { createdAt: 'DESC' },
      });
      return scenes.map(SceneMapper.toListItemResponse);
    }

    if (query.userId) {
      const resolvedUserId = query.userId === 'me' ? user.id : query.userId;
      const scenes = await this.sceneRepository.findByUserId(resolvedUserId);
      return scenes.map(SceneMapper.toListItemResponse);
    }

    throw new BadRequestException('Either workspaceId or userId query param is required');
  }

  public async getScene(sceneId: string, user: UserEntity | null): Promise<SceneResponseDto> {
    const scene = await this.loadSceneWithRelations(sceneId);
    await this.requireSceneReadAccess(scene, user?.id ?? null);
    return SceneMapper.toResponse(scene);
  }

  public async updateScene(sceneId: string, user: UserEntity, dto: SceneUpdateRequestDto): Promise<SceneResponseDto> {
    const scene = await this.loadSceneWithRelations(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);

    if (dto.name !== undefined) scene.name = dto.name;
    if (dto.description !== undefined) scene.description = dto.description ?? null;
    if (dto.config !== undefined) {
      scene.config = { ...(scene.config ?? this.defaultConfig()), ...dto.config };
    }
    if (dto.visibility !== undefined) scene.visibility = dto.visibility;

    const saved = await this.sceneRepository.save(scene);
    return SceneMapper.toResponse(saved);
  }

  public async deleteScene(sceneId: string, user: UserEntity): Promise<void> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);

    await this.sceneRepository.softDelete(sceneId);

    const orgId = scene.workspaceId ? await this.resolveOrgId(scene.workspaceId) : null;
    this.filesService.deleteSceneFiles(orgId, sceneId).catch((err) => {
      this.logger.warn(`Failed to delete scene files for ${sceneId}: ${String(err)}`);
    });
  }

  // ---------------------------------------------------------------------------
  // Objects
  // ---------------------------------------------------------------------------

  public async addObject(sceneId: string, user: UserEntity, dto: SceneObjectUpsertDto): Promise<SceneResponseDto> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);

    const limits = await this.getPlanLimitsForScene(scene);
    const count = await this.sceneObjectRepository.countByScene(sceneId);
    if (count >= limits.maxObjects) {
      throw new ForbiddenException('Object limit reached for your plan');
    }

    const obj = this.sceneObjectRepository.create({
      sceneId,
      modelId: dto.modelId,
      posX: dto.posX ?? 0,
      posY: dto.posY ?? 0,
      posZ: dto.posZ ?? 0,
      rotX: dto.rotX ?? 0,
      rotY: dto.rotY ?? 0,
      rotZ: dto.rotZ ?? 0,
      scaleX: dto.scaleX ?? 1,
      scaleY: dto.scaleY ?? 1,
      scaleZ: dto.scaleZ ?? 1,
      order: dto.order ?? 0,
      animationConfig: (dto.animationConfig as Record<string, unknown>) ?? null,
      audioConfig: (dto.audioConfig as Record<string, unknown>) ?? null,
    } as import('typeorm').DeepPartial<import('@/database/entities/scenes/scene-object.entity').SceneObjectEntity>);
    await this.sceneObjectRepository.save(obj);

    return this.getScene(sceneId, user);
  }

  public async updateObject(
    sceneId: string,
    objectId: string,
    user: UserEntity,
    dto: SceneObjectUpsertDto,
  ): Promise<SceneResponseDto> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);

    const obj = await this.sceneObjectRepository.findOne({ where: { id: objectId, sceneId } });
    if (!obj) throw new NotFoundException('Scene object not found');

    if (dto.posX !== undefined) obj.posX = dto.posX;
    if (dto.posY !== undefined) obj.posY = dto.posY;
    if (dto.posZ !== undefined) obj.posZ = dto.posZ;
    if (dto.rotX !== undefined) obj.rotX = dto.rotX;
    if (dto.rotY !== undefined) obj.rotY = dto.rotY;
    if (dto.rotZ !== undefined) obj.rotZ = dto.rotZ;
    if (dto.scaleX !== undefined) obj.scaleX = dto.scaleX;
    if (dto.scaleY !== undefined) obj.scaleY = dto.scaleY;
    if (dto.scaleZ !== undefined) obj.scaleZ = dto.scaleZ;
    if (dto.order !== undefined) obj.order = dto.order;
    if ('animationConfig' in dto) obj.animationConfig = (dto.animationConfig as Record<string, unknown>) ?? null;
    if ('audioConfig' in dto) obj.audioConfig = (dto.audioConfig as Record<string, unknown>) ?? null;

    await this.sceneObjectRepository.save(obj);
    return this.getScene(sceneId, user);
  }

  public async removeObject(sceneId: string, objectId: string, user: UserEntity): Promise<void> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);
    await this.sceneObjectRepository.softDelete({ id: objectId, sceneId });
  }

  // ---------------------------------------------------------------------------
  // Lights
  // ---------------------------------------------------------------------------

  public async addLight(sceneId: string, user: UserEntity, dto: SceneLightUpsertDto): Promise<SceneResponseDto> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);

    const limits = await this.getPlanLimitsForScene(scene);
    const count = await this.sceneLightRepository.countByScene(sceneId);
    if (count >= limits.maxLights) {
      throw new ForbiddenException('Light limit reached for your plan');
    }

    const light = this.sceneLightRepository.create({
      sceneId,
      type: dto.type,
      posX: dto.posX ?? 0,
      posY: dto.posY ?? 0,
      posZ: dto.posZ ?? 0,
      color: dto.color ?? '#ffffff',
      intensity: dto.intensity ?? 1.0,
      castShadow: dto.castShadow ?? true,
    });
    await this.sceneLightRepository.save(light);

    return this.getScene(sceneId, user);
  }

  public async updateLight(
    sceneId: string,
    lightId: string,
    user: UserEntity,
    dto: SceneLightUpsertDto,
  ): Promise<SceneResponseDto> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);

    const light = await this.sceneLightRepository.findOne({ where: { id: lightId, sceneId } });
    if (!light) throw new NotFoundException('Scene light not found');

    if (dto.type !== undefined) light.type = dto.type;
    if (dto.posX !== undefined) light.posX = dto.posX;
    if (dto.posY !== undefined) light.posY = dto.posY;
    if (dto.posZ !== undefined) light.posZ = dto.posZ;
    if (dto.color !== undefined) light.color = dto.color;
    if (dto.intensity !== undefined) light.intensity = dto.intensity;
    if (dto.castShadow !== undefined) light.castShadow = dto.castShadow;

    await this.sceneLightRepository.save(light);
    return this.getScene(sceneId, user);
  }

  public async removeLight(sceneId: string, lightId: string, user: UserEntity): Promise<void> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);
    await this.sceneLightRepository.softDelete({ id: lightId, sceneId });
  }

  // ---------------------------------------------------------------------------
  // HDRI & Thumbnail
  // ---------------------------------------------------------------------------

  public async uploadHdri(sceneId: string, user: UserEntity, file: Express.Multer.File): Promise<SceneResponseDto> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);

    const limits = await this.getPlanLimitsForScene(scene);
    if (!limits.hdriEnabled) {
      throw new ForbiddenException('HDRI environment is not available on your plan');
    }

    if (scene.workspaceId) {
      const orgId = await this.resolveOrgId(scene.workspaceId);
      await this.filesService.saveSceneHdri(orgId, sceneId, file);
    } else {
      await this.filesService.saveSceneHdri(null as unknown as string, sceneId, file);
    }

    scene.config = { ...(scene.config ?? this.defaultConfig()), environmentHdriPath: 'environment.hdr' };
    await this.sceneRepository.save(scene);

    return this.getScene(sceneId, user);
  }

  public async getHdriFile(sceneId: string): Promise<StreamableFile | { redirect: string }> {
    const scene = await this.loadScene(sceneId);

    if (scene.workspaceId) {
      const orgId = await this.resolveOrgId(scene.workspaceId);
      const url = await this.filesService.getSceneHdriUrl(orgId, sceneId);
      if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
        return { redirect: url };
      }
    }

    const filePath = resolve(process.cwd(), 'files', 'scenes', sceneId, 'environment.hdr');
    const stream = createReadStream(filePath);
    return new StreamableFile(stream, { type: 'application/octet-stream' });
  }

  public async saveThumbnail(sceneId: string, user: UserEntity, thumbnail: string): Promise<SceneResponseDto> {
    const scene = await this.loadScene(sceneId);
    await this.requireSceneWriteAccess(scene, user.id);

    const base64Data = thumbnail.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (scene.workspaceId) {
      const orgId = await this.resolveOrgId(scene.workspaceId);
      await this.filesService.saveSceneThumbnail(orgId, sceneId, buffer);
    } else {
      await this.filesService.saveSceneThumbnail(null as unknown as string, sceneId, buffer);
    }

    scene.thumbnailPath = `scenes/${sceneId}/thumbnail.png`;
    await this.sceneRepository.save(scene);
    return this.getScene(sceneId, user);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async loadScene(sceneId: string): Promise<SceneEntity> {
    const scene = await this.sceneRepository.findOne({ where: { id: sceneId } });
    if (!scene) throw new NotFoundException('Scene not found');
    return scene;
  }

  private async loadSceneWithRelations(sceneId: string): Promise<SceneEntity> {
    const scene = await this.sceneRepository.findOne({
      where: { id: sceneId },
      relations: { objects: { model: { file: true } }, lights: true },
    });
    if (!scene) throw new NotFoundException('Scene not found');
    return scene;
  }

  private async requireSceneReadAccess(scene: SceneEntity, userId: string | null): Promise<void> {
    if (scene.visibility === 'public' || scene.visibility === 'unlisted') return;
    if (!userId) throw new ForbiddenException('Access denied');
    if (scene.workspaceId) {
      await this.requireMember(scene.workspaceId, userId);
      return;
    }
    if (scene.userId === userId) return;
    throw new ForbiddenException('Access denied');
  }

  private async requireSceneWriteAccess(scene: SceneEntity, userId: string | null): Promise<void> {
    if (!userId) throw new ForbiddenException('Access denied');
    if (scene.workspaceId) {
      await this.requireMember(scene.workspaceId, userId);
      return;
    }
    if (scene.userId === userId) return;
    throw new ForbiddenException('Access denied');
  }

  private async requireMember(workspaceId: string, userId: string): Promise<void> {
    const member = await this.workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenException('Not a workspace member');
  }

  private async resolveOrgId(workspaceId: string): Promise<string> {
    const workspace = await this.dataSource.getRepository(WorkspaceEntity).findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace.orgId;
  }

  private async getPlanLimits(workspaceId: string): Promise<(typeof SCENE_LIMITS)[PlanType]> {
    const orgId = await this.resolveOrgId(workspaceId);
    const org = await this.dataSource.getRepository(OrganizationEntity).findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return SCENE_LIMITS[org.planType];
  }

  private async getPlanLimitsForScene(scene: SceneEntity): Promise<(typeof SCENE_LIMITS)[PlanType]> {
    if (!scene.workspaceId) {
      return SCENE_LIMITS[PlanType.Starter];
    }
    return this.getPlanLimits(scene.workspaceId);
  }

  private defaultConfig() {
    return {
      backgroundColor: '#000000',
      ambientLightIntensity: 0.5,
      cameraBookmarks: [],
    };
  }
}
