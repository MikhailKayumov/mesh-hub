import { extname } from 'path';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelMaterialOverrideEntity } from '@/database/entities/models-3d/model-material-override.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { FilesService } from '@/modules/files/files.service';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { MaterialOverrideResponseDto } from './dto/material-override.response.dto';
import { MaterialOverrideUpsertDto } from './dto/material-override.upsert.dto';
import { MaterialOverrideRepository } from './material-override.repository';

const TEXTURE_TYPES = ['map', 'normal', 'roughness', 'metalness', 'emissive', 'ao'] as const;
type TextureType = (typeof TEXTURE_TYPES)[number];

@Injectable()
export class MaterialsService {
  public constructor(
    private readonly filesService: FilesService,
    private readonly model3dRepository: Model3dRepository,
    private readonly materialOverrideRepository: MaterialOverrideRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  public async listMaterials(modelId: string): Promise<MaterialOverrideResponseDto[]> {
    const overrides = await this.materialOverrideRepository.findByModelId(modelId);
    return overrides.map((o) => this.toResponse(o, modelId));
  }

  public async upsertMaterial(
    modelId: string,
    meshName: string,
    user: UserEntity,
    dto: MaterialOverrideUpsertDto,
  ): Promise<MaterialOverrideResponseDto> {
    await this.loadModel(modelId, user);

    let override = await this.materialOverrideRepository.findByModelAndMesh(modelId, meshName);
    if (!override) {
      override = this.materialOverrideRepository.getRepository().create({ modelId, meshName, wireframe: false });
    }

    if (dto.colorHex !== undefined) override.colorHex = dto.colorHex;
    if (dto.metalness !== undefined) override.metalness = dto.metalness;
    if (dto.roughness !== undefined) override.roughness = dto.roughness;
    if (dto.emissiveHex !== undefined) override.emissiveHex = dto.emissiveHex;
    if (dto.emissiveIntensity !== undefined) override.emissiveIntensity = dto.emissiveIntensity;
    if (dto.opacity !== undefined) override.opacity = dto.opacity;
    if (dto.wireframe !== undefined) override.wireframe = dto.wireframe;

    const saved = await this.materialOverrideRepository.save(override);
    return this.toResponse(saved, modelId);
  }

  public async deleteMaterial(modelId: string, meshName: string, user: UserEntity): Promise<void> {
    const model = await this.loadModel(modelId, user);
    const override = await this.materialOverrideRepository.findByModelAndMesh(modelId, meshName);
    if (!override) throw new NotFoundException('Material override not found');

    const orgId = await this.resolveOrgId(model);
    // Delete all associated textures
    await Promise.all(
      TEXTURE_TYPES.map((type) =>
        this.filesService.deleteModelMaterialTexture(orgId, modelId, override.id, type).catch(() => undefined),
      ),
    );

    await this.materialOverrideRepository.softDelete(override.id);
  }

  public async uploadTexture(
    modelId: string,
    meshName: string,
    user: UserEntity,
    type: string,
    file: Express.Multer.File,
  ): Promise<MaterialOverrideResponseDto> {
    const model = await this.loadModel(modelId, user);
    const orgId = await this.resolveOrgId(model);

    let override = await this.materialOverrideRepository.findByModelAndMesh(modelId, meshName);
    if (!override) {
      override = this.materialOverrideRepository.getRepository().create({ modelId, meshName, wireframe: false });
      override = await this.materialOverrideRepository.save(override);
    }

    await this.filesService.saveModelMaterialTexture(orgId, modelId, override.id, type, file);

    const ext = extname(file.originalname) || '.png';
    const path = `models-3d/${modelId}/materials/${override.id}/${type}${ext}`;

    switch (type as TextureType) {
      case 'map':
        override.textureMapPath = path;
        break;
      case 'normal':
        override.normalMapPath = path;
        break;
      case 'roughness':
        override.roughnessMapPath = path;
        break;
      case 'metalness':
        override.metalnessMapPath = path;
        break;
      case 'emissive':
        override.emissiveMapPath = path;
        break;
      case 'ao':
        override.aoMapPath = path;
        break;
    }

    const saved = await this.materialOverrideRepository.save(override);
    return this.toResponse(saved, modelId);
  }

  public async clearTexture(
    modelId: string,
    meshName: string,
    user: UserEntity,
    type: string,
  ): Promise<MaterialOverrideResponseDto> {
    const model = await this.loadModel(modelId, user);
    const orgId = await this.resolveOrgId(model);

    const override = await this.materialOverrideRepository.findByModelAndMesh(modelId, meshName);
    if (!override) throw new NotFoundException('Material override not found');

    await this.filesService.deleteModelMaterialTexture(orgId, modelId, override.id, type).catch(() => undefined);

    switch (type as TextureType) {
      case 'map':
        override.textureMapPath = undefined;
        break;
      case 'normal':
        override.normalMapPath = undefined;
        break;
      case 'roughness':
        override.roughnessMapPath = undefined;
        break;
      case 'metalness':
        override.metalnessMapPath = undefined;
        break;
      case 'emissive':
        override.emissiveMapPath = undefined;
        break;
      case 'ao':
        override.aoMapPath = undefined;
        break;
    }

    const saved = await this.materialOverrideRepository.save(override);
    return this.toResponse(saved, modelId);
  }

  public async getOverrideForTexture(
    modelId: string,
    meshName: string,
    type: string,
  ): Promise<{ path: string; mimeType: string } | null> {
    const override = await this.materialOverrideRepository.findByModelAndMesh(modelId, meshName);
    if (!override) return null;

    let filePath: string | undefined;
    switch (type as TextureType) {
      case 'map':
        filePath = override.textureMapPath;
        break;
      case 'normal':
        filePath = override.normalMapPath;
        break;
      case 'roughness':
        filePath = override.roughnessMapPath;
        break;
      case 'metalness':
        filePath = override.metalnessMapPath;
        break;
      case 'emissive':
        filePath = override.emissiveMapPath;
        break;
      case 'ao':
        filePath = override.aoMapPath;
        break;
    }

    if (!filePath) return null;

    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'png';
    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };
    return { path: filePath, mimeType: mimeMap[ext] ?? 'image/png' };
  }

  private async loadModel(modelId: string, user: UserEntity): Promise<Model3dEntity> {
    const model = await this.model3dRepository.findOne({
      where: { id: modelId },
      relations: { user: true },
    });
    if (!model) throw new NotFoundException('Модель не найдена');
    if (model.user?.id !== user.id) throw new ForbiddenException('Нет доступа к материалам модели');
    return model;
  }

  private async resolveOrgId(model: Model3dEntity): Promise<string | null> {
    if (!model.workspaceId) return null;
    const workspace = await this.dataSource
      .getRepository(WorkspaceEntity)
      .findOne({ where: { id: model.workspaceId } });
    return workspace?.orgId ?? null;
  }

  private toResponse(entity: ModelMaterialOverrideEntity, modelId: string): MaterialOverrideResponseDto {
    const textureUrl = (path: string | undefined, type: string): string | undefined => {
      if (!path) return undefined;
      return `/api/models-3d/${modelId}/materials/${encodeURIComponent(entity.meshName)}/texture/${type}`;
    };

    return {
      id: entity.id,
      modelId: entity.modelId,
      meshName: entity.meshName,
      colorHex: entity.colorHex,
      metalness: entity.metalness,
      roughness: entity.roughness,
      emissiveHex: entity.emissiveHex,
      emissiveIntensity: entity.emissiveIntensity,
      opacity: entity.opacity,
      wireframe: entity.wireframe,
      textureMapUrl: textureUrl(entity.textureMapPath, 'map'),
      normalMapUrl: textureUrl(entity.normalMapPath, 'normal'),
      roughnessMapUrl: textureUrl(entity.roughnessMapPath, 'roughness'),
      metalnessMapUrl: textureUrl(entity.metalnessMapPath, 'metalness'),
      emissiveMapUrl: textureUrl(entity.emissiveMapPath, 'emissive'),
      aoMapUrl: textureUrl(entity.aoMapPath, 'ao'),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
    };
  }
}
