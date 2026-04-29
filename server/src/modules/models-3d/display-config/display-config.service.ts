import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ModelVisibility } from '@/constants';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelDisplayConfigEntity } from '@/database/entities/models-3d/model-display-config.entity';
import { ModelLightEntity } from '@/database/entities/models-3d/model-light.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { FilesService } from '@/modules/files/files.service';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { DisplayConfigResponseDto, ModelLightResponseDto } from './dto/display-config.response.dto';
import { DisplayConfigUpdateDto } from './dto/display-config.update.dto';
import { ModelLightUpsertDto, ModelLightUpdateDto } from './dto/model-light.upsert.dto';
import { DisplayConfigRepository } from './repositories/display-config.repository';
import { ModelLightRepository } from './repositories/model-light.repository';

@Injectable()
export class DisplayConfigService {
  public constructor(
    private readonly filesService: FilesService,
    private readonly model3dRepository: Model3dRepository,
    private readonly displayConfigRepository: DisplayConfigRepository,
    private readonly modelLightRepository: ModelLightRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  public async getOrCreate(modelId: string, user: UserEntity | null): Promise<DisplayConfigResponseDto> {
    await this.loadModelForRead(modelId, user);
    let config = await this.displayConfigRepository.findByModelId(modelId);
    if (!config) {
      config = await this.displayConfigRepository.createDefault(modelId);
    }
    const lights = await this.modelLightRepository.findByModelId(modelId);
    return this.toResponse(config, lights);
  }

  public async update(
    modelId: string,
    user: UserEntity,
    dto: DisplayConfigUpdateDto,
  ): Promise<DisplayConfigResponseDto> {
    await this.loadModel(modelId, user);
    let config = await this.displayConfigRepository.findByModelId(modelId);
    if (!config) {
      config = await this.displayConfigRepository.createDefault(modelId);
    }

    if (dto.backgroundColor !== undefined) config.backgroundColor = dto.backgroundColor;
    if (dto.ambientIntensity !== undefined) config.ambientIntensity = dto.ambientIntensity;
    if (dto.fogEnabled !== undefined) config.fogEnabled = dto.fogEnabled;
    if (dto.fogType !== undefined) config.fogType = dto.fogType;
    if (dto.fogColor !== undefined) config.fogColor = dto.fogColor;
    if (dto.fogNear !== undefined) config.fogNear = dto.fogNear;
    if (dto.fogFar !== undefined) config.fogFar = dto.fogFar;
    if (dto.postProcess !== undefined) config.postProcess = dto.postProcess;
    if (dto.rendererConfig !== undefined) config.rendererConfig = dto.rendererConfig;

    const saved = await this.displayConfigRepository.save(config);
    const lights = await this.modelLightRepository.findByModelId(modelId);
    return this.toResponse(saved, lights);
  }

  public async uploadHdri(
    modelId: string,
    user: UserEntity,
    file: Express.Multer.File,
  ): Promise<DisplayConfigResponseDto> {
    const model = await this.loadModel(modelId, user);
    const orgId = await this.resolveOrgId(model);

    let config = await this.displayConfigRepository.findByModelId(modelId);
    if (!config) config = await this.displayConfigRepository.createDefault(modelId);

    await this.filesService.saveModelDisplayHdri(orgId, modelId, file);
    config.environmentHdriPath = `models-3d/${modelId}/display-hdri.hdr`;
    const saved = await this.displayConfigRepository.save(config);
    const lights = await this.modelLightRepository.findByModelId(modelId);
    return this.toResponse(saved, lights);
  }

  public async removeHdri(modelId: string, user: UserEntity): Promise<DisplayConfigResponseDto> {
    const model = await this.loadModel(modelId, user);
    const orgId = await this.resolveOrgId(model);

    const config = await this.displayConfigRepository.findByModelId(modelId);
    if (!config) throw new NotFoundException('Display config not found');

    if (config.environmentHdriPath) {
      await this.filesService.deleteModelDisplayHdri(orgId, modelId);
      config.environmentHdriPath = undefined;
      await this.displayConfigRepository.save(config);
    }

    const lights = await this.modelLightRepository.findByModelId(modelId);
    return this.toResponse(config, lights);
  }

  public async addLight(
    modelId: string,
    user: UserEntity,
    dto: ModelLightUpsertDto,
  ): Promise<DisplayConfigResponseDto> {
    await this.loadModel(modelId, user);
    const config = await this.getOrCreateConfig(modelId);

    const light = this.modelLightRepository.getRepository().create({
      modelId,
      type: dto.type,
      posX: dto.posX ?? 0,
      posY: dto.posY ?? 5,
      posZ: dto.posZ ?? 5,
      color: dto.color ?? '#ffffff',
      intensity: dto.intensity ?? 1.0,
      castShadow: dto.castShadow ?? true,
    });
    await this.modelLightRepository.save(light);

    const lights = await this.modelLightRepository.findByModelId(modelId);
    return this.toResponse(config, lights);
  }

  public async updateLight(
    modelId: string,
    lightId: string,
    user: UserEntity,
    dto: ModelLightUpdateDto,
  ): Promise<DisplayConfigResponseDto> {
    await this.loadModel(modelId, user);
    const config = await this.getOrCreateConfig(modelId);

    const light = await this.modelLightRepository.findOne(lightId, modelId);
    if (!light) throw new NotFoundException('Light not found');

    if (dto.type !== undefined) light.type = dto.type;
    if (dto.posX !== undefined) light.posX = dto.posX;
    if (dto.posY !== undefined) light.posY = dto.posY;
    if (dto.posZ !== undefined) light.posZ = dto.posZ;
    if (dto.color !== undefined) light.color = dto.color;
    if (dto.intensity !== undefined) light.intensity = dto.intensity;
    if (dto.castShadow !== undefined) light.castShadow = dto.castShadow;

    await this.modelLightRepository.save(light);

    const lights = await this.modelLightRepository.findByModelId(modelId);
    return this.toResponse(config, lights);
  }

  public async removeLight(modelId: string, lightId: string, user: UserEntity): Promise<void> {
    await this.loadModel(modelId, user);
    const light = await this.modelLightRepository.findOne(lightId, modelId);
    if (!light) throw new NotFoundException('Light not found');
    await this.modelLightRepository.softDelete(lightId);
  }

  private async loadModel(modelId: string, user: UserEntity): Promise<Model3dEntity> {
    const model = await this.model3dRepository.findOne({
      where: { id: modelId },
      relations: { user: true },
    });
    if (!model) throw new NotFoundException('Модель не найдена');
    if (model.user?.id !== user.id) throw new ForbiddenException('Нет доступа к конфигурации модели');
    return model;
  }

  private async loadModelForRead(modelId: string, user: UserEntity | null): Promise<Model3dEntity> {
    const model = await this.model3dRepository.findOne({
      where: { id: modelId },
      relations: { user: true },
    });
    if (!model) throw new NotFoundException('Модель не найдена');
    if (model.visibility === ModelVisibility.Public || model.visibility === ModelVisibility.Unlisted) return model;
    if (user && model.user?.id === user.id) return model;
    throw new ForbiddenException('Нет доступа к конфигурации модели');
  }

  private async getOrCreateConfig(modelId: string): Promise<ModelDisplayConfigEntity> {
    let config = await this.displayConfigRepository.findByModelId(modelId);
    if (!config) config = await this.displayConfigRepository.createDefault(modelId);
    return config;
  }

  private async resolveOrgId(model: Model3dEntity): Promise<string | null> {
    if (!model.workspaceId) return null;
    const workspace = await this.dataSource
      .getRepository(WorkspaceEntity)
      .findOne({ where: { id: model.workspaceId } });
    return workspace?.orgId ?? null;
  }

  private toResponse(config: ModelDisplayConfigEntity, lights: ModelLightEntity[]): DisplayConfigResponseDto {
    return {
      id: config.id,
      modelId: config.modelId,
      backgroundColor: config.backgroundColor,
      ambientIntensity: config.ambientIntensity,
      environmentHdriPath: config.environmentHdriPath,
      fogEnabled: config.fogEnabled,
      fogType: config.fogType,
      fogColor: config.fogColor,
      fogNear: config.fogNear,
      fogFar: config.fogFar,
      postProcess: config.postProcess,
      rendererConfig: config.rendererConfig,
      lights: lights.map(this.lightToResponse),
    };
  }

  private lightToResponse(light: ModelLightEntity): ModelLightResponseDto {
    return {
      id: light.id,
      type: light.type,
      posX: light.posX,
      posY: light.posY,
      posZ: light.posZ,
      color: light.color,
      intensity: light.intensity,
      castShadow: light.castShadow,
      createdAt: light.createdAt.toISOString(),
    };
  }
}
