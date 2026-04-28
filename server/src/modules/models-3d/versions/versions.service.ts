import { extname } from 'path';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Model3dFileEntity } from '@/database/entities/models-3d/model-3d-file.entity';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelVersionEntity } from '@/database/entities/models-3d/model-version.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { FilesService } from '@/modules/files/files.service';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { VersionResponseDto } from './dto/version.response.dto';
import { VersionUploadRequestDto } from './dto/version.upload.request.dto';
import { ModelVersionMapper } from './model-version.mapper';
import { ModelVersionRepository } from './model-version.repository';

@Injectable()
export class VersionsService {
  private readonly logger = new Logger(VersionsService.name);

  public constructor(
    private readonly filesService: FilesService,
    private readonly model3dRepository: Model3dRepository,
    private readonly versionRepository: ModelVersionRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  public async getVersions(modelId: string, user: UserEntity): Promise<VersionResponseDto[]> {
    const model = await this.model3dRepository.findOne({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Модель не найдена');

    // Only the owner can see versions
    if (model.user?.id !== user.id && !this.isUserIdEqual(model, user)) {
      // Reload with user relation if needed
      const fullModel = await this.model3dRepository.findOne({
        where: { id: modelId },
        relations: { user: true },
      });
      if (fullModel?.user?.id !== user.id) {
        throw new ForbiddenException('Нет доступа к версиям модели');
      }
    }

    const versions = await this.versionRepository.findByModelId(modelId);
    return versions.map(ModelVersionMapper.toResponse);
  }

  public async uploadVersion(
    modelId: string,
    user: UserEntity,
    file: Express.Multer.File,
    dto: VersionUploadRequestDto,
  ): Promise<VersionResponseDto> {
    const model = await this.model3dRepository.findOne({
      where: { id: modelId },
      relations: { user: true, file: true },
    });
    if (!model) throw new NotFoundException('Модель не найдена');
    if (model.user.id !== user.id) throw new ForbiddenException('Только владелец может загружать новые версии');

    const orgId = await this.resolveOrgId(model);
    const isZip = extname(file.originalname).toLowerCase() === '.zip';

    let savedVersionId = '';
    try {
      const savedVersion = await this.dataSource.transaction(async (em) => {
        // Pessimistic write lock on model row
        const lockedModel = await em.getRepository(Model3dEntity).findOne({
          where: { id: modelId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!lockedModel) throw new NotFoundException('Модель не найдена');

        const lastVersion = await this.versionRepository.findLastVersion(modelId, em);
        const nextNumber = (lastVersion?.versionNumber ?? 0) + 1;

        const versionEntity = em.create(ModelVersionEntity, {
          modelId,
          uploaderId: user.id,
          versionNumber: nextNumber,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          changeNotes: dto.changeNotes,
          isActive: false,
        });

        const saved = await em.save(versionEntity);
        savedVersionId = saved.id;
        return saved;
      });

      // Save file outside transaction (reversible via cleanup on error)
      if (isZip) {
        const { entryFile } = await this.filesService.extractAndSaveModelVersionDirectory(
          modelId,
          savedVersion.id,
          file,
          orgId,
        );
        await this.versionRepository.getRepository().update(savedVersion.id, { entryFile });
        savedVersion.entryFile = entryFile;
      } else {
        if (orgId) {
          await this.filesService.saveModelVersionForOrg(orgId, modelId, savedVersion.id, file);
        } else {
          await this.filesService.saveModelVersion(modelId, savedVersion.id, file);
        }
      }

      // Load with uploader relation for response mapping
      const full = await this.versionRepository.findById(savedVersion.id);
      if (!full) throw new UnprocessableEntityException('Версия не найдена после сохранения');
      return ModelVersionMapper.toResponse(full);
    } catch (e) {
      this.logger.error('uploadVersion failed', e);
      if (savedVersionId) {
        this.filesService.deleteModelVersion(modelId, savedVersionId).catch(() => {});
      } else {
        this.filesService.deleteFile(file.path, true).catch(() => {});
      }
      if (e instanceof BadRequestException || e instanceof ForbiddenException || e instanceof NotFoundException) {
        throw e;
      }
      throw new BadRequestException('Не удалось сохранить версию');
    }
  }

  public async activateVersion(modelId: string, versionId: string, user: UserEntity): Promise<VersionResponseDto> {
    const model = await this.model3dRepository.findOne({
      where: { id: modelId },
      relations: { user: true, file: true },
    });
    if (!model) throw new NotFoundException('Модель не найдена');
    if (model.user.id !== user.id) throw new ForbiddenException('Только владелец может активировать версии');

    const targetVersion = await this.versionRepository.findById(versionId);
    if (!targetVersion || targetVersion.modelId !== modelId) throw new NotFoundException('Версия не найдена');
    if (targetVersion.isActive) return ModelVersionMapper.toResponse(targetVersion);

    const orgId = await this.resolveOrgId(model);

    await this.dataSource.transaction(async (em) => {
      // Pessimistic lock
      await em.getRepository(Model3dEntity).findOne({
        where: { id: modelId },
        lock: { mode: 'pessimistic_write' },
      });

      // Deactivate all versions
      await em.getRepository(ModelVersionEntity).update({ modelId }, { isActive: false });
      // Activate target
      await em.getRepository(ModelVersionEntity).update({ id: versionId }, { isActive: true });

      // Update model's currentVersionId and file.entryFile
      const fileUpdate: Partial<Model3dFileEntity> = {
        entryFile: targetVersion.entryFile ?? targetVersion.fileName,
      };
      await em.save(Model3dFileEntity, { id: model.file.id, ...fileUpdate });
      await em.save(Model3dEntity, { id: modelId, currentVersionId: versionId });
    });

    // Copy version files to model root
    try {
      if (orgId) {
        await this.filesService.copyVersionToRootForOrg(orgId, modelId, versionId, targetVersion.entryFile);
      } else {
        await this.filesService.copyVersionToRoot(modelId, versionId, targetVersion.entryFile);
      }
    } catch (e) {
      this.logger.error('copyVersionToRoot failed', e);
      // DB is already updated — log the error but don't roll back to keep DB consistent
    }

    const full = await this.versionRepository.findById(versionId);
    return ModelVersionMapper.toResponse(full!);
  }

  public async deleteVersion(modelId: string, versionId: string, user: UserEntity): Promise<void> {
    const model = await this.model3dRepository.findOne({
      where: { id: modelId },
      relations: { user: true },
    });
    if (!model) throw new NotFoundException('Модель не найдена');
    if (model.user.id !== user.id) throw new ForbiddenException('Только владелец может удалять версии');

    const version = await this.versionRepository.findById(versionId);
    if (!version || version.modelId !== modelId) throw new NotFoundException('Версия не найдена');
    if (version.isActive) throw new BadRequestException('Нельзя удалить активную версию');

    const orgId = await this.resolveOrgId(model);

    await this.versionRepository.getRepository().softDelete({ id: versionId });

    try {
      if (orgId) {
        await this.filesService.deleteModelVersionForOrg(orgId, modelId, versionId);
      } else {
        await this.filesService.deleteModelVersion(modelId, versionId);
      }
    } catch (e) {
      this.logger.error('deleteModelVersion files failed', e);
    }
  }

  private async resolveOrgId(model: Model3dEntity): Promise<string | undefined> {
    if (!model.workspaceId) return undefined;
    const workspace = await this.dataSource
      .getRepository(WorkspaceEntity)
      .findOne({ where: { id: model.workspaceId } });
    return workspace?.orgId;
  }

  private isUserIdEqual(model: Model3dEntity, user: UserEntity): boolean {
    return model.user.id === user.id;
  }
}
