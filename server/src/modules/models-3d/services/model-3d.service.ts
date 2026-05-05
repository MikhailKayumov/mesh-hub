import { extname } from 'path';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { In, DataSource } from 'typeorm';
import { ModelVisibility } from '@/constants';
import { Model3dFileEntity } from '@/database/entities/models-3d/model-3d-file.entity';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { PaginationDto, PaginationResponseDto, PaginationSortOrder } from '@/decorators/pagination';
import { FilesService } from '@/modules/files/files.service';
import { Model3dResponseDto } from '@/modules/models-3d/dto/model-3d.response.dto';
import { Model3dUpdateRequestDto } from '@/modules/models-3d/dto/model-3d.update.request.dto';
import { Models3dRequestDto } from '@/modules/models-3d/dto/models-3d.request.dto';
import { Model3dMapper } from '@/modules/models-3d/mappers/model-3d.mapper';
import { Model3dFileRepository } from '@/modules/models-3d/repositories/model-3d-file.repository';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { WebhookDeliveryService } from '@/modules/organizations/webhooks/services/webhook-delivery.service';
import { CategoryRepository } from '@/modules/resources/repositories/category.repository';
import { StorageQuotaService } from '@/modules/storage-quota/storage-quota.service';
import { WorkspaceMemberRepository } from '@/modules/workspaces/repositories/workspace-member.repository';

@Injectable()
export class Model3dService {
  private readonly logger = new Logger(Model3dService.name);

  public constructor(
    private readonly filesService: FilesService,
    private readonly model3dRepository: Model3dRepository,
    private readonly model3dFileRepository: Model3dFileRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly storageQuotaService: StorageQuotaService,
    private readonly webhookDeliveryService: WebhookDeliveryService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Load a bare model entity (no relations) — used for file serving path resolution. */
  public async getModel(id: string): Promise<Model3dEntity> {
    const model = await this.model3dRepository.findOne({ where: { id } });
    if (!model) throw new NotFoundException('Модель не найдена');
    return model;
  }

  private async fireModelUploadedWebhook(
    modelId: string,
    name: string,
    workspaceId: string,
    format?: string,
  ): Promise<void> {
    try {
      const workspace = await this.dataSource.getRepository(WorkspaceEntity).findOne({ where: { id: workspaceId } });
      if (!workspace) return;
      await this.webhookDeliveryService.dispatch(workspace.orgId, 'model.uploaded', {
        modelId,
        name,
        format: format ?? null,
        workspaceId,
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch model.uploaded webhook for model ${modelId}: ${String(err)}`);
    }
  }

  /** Load a workspace entity by id — used to resolve orgId for storage strategy. */
  public async getWorkspace(id: string): Promise<WorkspaceEntity> {
    const workspace = await this.dataSource.getRepository(WorkspaceEntity).findOne({ where: { id } });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  public async get3DModel(id: string, user?: UserEntity) {
    const model = await this.model3dRepository.findOne({
      relations: {
        user: { userMeta: true },
        file: true,
        categories: true,
      },
      where: { id: id },
    });

    if (!model) {
      throw new NotFoundException('Модель не найдена');
    }

    return Model3dMapper.toModel3DResponse(model, user);
  }

  public async getStats(): Promise<{ totalModels: number }> {
    const totalModels = await this.model3dRepository.count({
      where: { visibility: ModelVisibility.Public },
    });
    return { totalModels };
  }

  public async get3DModels(
    pagination: PaginationDto,
    filters: Models3dRequestDto,
    user?: UserEntity,
  ): Promise<PaginationResponseDto<Model3dResponseDto>> {
    const [models, count] = await this.find3DModels(pagination, filters, user);

    return PaginationResponseDto.build(
      models.map((m) => Model3dMapper.toModel3DResponse(m, user)),
      count,
    );
  }

  public async getCurrentUser3DModels(
    pagination: PaginationDto,
    filters: Models3dRequestDto,
    user: UserEntity,
  ): Promise<PaginationResponseDto<Model3dResponseDto>> {
    const [models, count] = await this.find3DModels(pagination, filters, user, true);

    return PaginationResponseDto.build(
      models.map((m) => Model3dMapper.toModel3DResponse(m, user)),
      count,
    );
  }

  public async upload3DModel(
    user: UserEntity,
    file: Express.Multer.File,
    workspaceId?: string,
  ): Promise<{ modelId: string }> {
    let savedModelId: string = '';

    if (workspaceId) {
      await this.storageQuotaService.checkStorageQuotaByWorkspace(workspaceId);
    }

    try {
      const model = await this.model3dRepository.manager.transaction(async (em) => {
        const fileEntity = new Model3dFileEntity();
        fileEntity.name = file.originalname;
        fileEntity.size = file.size;
        fileEntity.extension = extname(file.originalname);

        const isZip = extname(file.originalname).toLowerCase() === '.zip';
        if (!isZip) {
          fileEntity.originalFormat = extname(file.originalname).slice(1).toLowerCase();
        }

        const createdFileEntity = await em.save(fileEntity);

        const modelEntity = new Model3dEntity();
        modelEntity.user = user;
        modelEntity.name = file.originalname.substring(0, file.originalname.lastIndexOf('.')).trim();
        modelEntity.file = createdFileEntity;
        if (workspaceId) {
          modelEntity.workspaceId = workspaceId;
        }

        const savedModel = await em.save(modelEntity);
        savedModelId = savedModel.id;

        if (isZip) {
          const { entryFile, format } = await this.filesService.extractAndSave3DModelDirectory(savedModel.id, file);
          createdFileEntity.entryFile = entryFile;
          createdFileEntity.originalFormat = format;
          await em.save(createdFileEntity);
          await this.filesService.deleteFile(file.path);
        } else {
          await this.filesService.save3DModel(savedModel.id, file);
        }

        return savedModel;
      });

      if (workspaceId) {
        void this.fireModelUploadedWebhook(model.id, model.name, workspaceId, model.file?.originalFormat);
      }

      return {
        modelId: model.id,
      };
    } catch (e) {
      this.logger.error(e);

      if (savedModelId) {
        this.filesService.delete3DModel(savedModelId);
      } else {
        this.filesService.deleteFile(file.path);
      }

      throw new BadRequestException('Не удалось сохранить 3D модель');
    }
  }

  public async delete3DModel(id: string, user: UserEntity) {
    const model = await this.model3dRepository.findOne({
      relations: { file: true },
      where: { id: id, user: { id: user.id } },
    });

    if (!model) {
      throw new NotFoundException('Модель не найдена');
    }

    try {
      await this.model3dRepository.delete({ id });
      await this.model3dFileRepository.delete({ id: model.file.id });
      await this.filesService.delete3DModel(model.id, false);
    } catch (e) {
      this.logger.error(e);
      throw new BadRequestException('Не удалось удалить файл');
    }
  }

  public async update3DModel(id: string, user: UserEntity, { categories, ...body }: Model3dUpdateRequestDto) {
    const model = await this.model3dRepository.findOne({
      relations: { file: true, user: true },
      where: { id: id, user: { id: user.id } },
    });

    if (!model) {
      throw new NotFoundException('Модель не найдена');
    }

    const entity = this.model3dRepository.merge(model, body);
    if (categories?.length) {
      entity.categories = await this.categoryRepository.findBy({ id: In(categories.map((c) => c.id)) });
    }

    return Model3dMapper.toModel3DResponse(await this.model3dRepository.save(entity), user);
  }

  public async save3DModelThumbnailFromBase64(user: UserEntity, id: string, thumbnail: string) {
    const model = await this.model3dRepository.findOne({
      relations: { file: true },
      where: { id: id, user: { id: user.id } },
    });

    if (!model) {
      throw new NotFoundException('Модель не найдена');
    }

    model.thumbnail = await this.filesService.save3DModelThumbnailFromBase64(model.id, thumbnail);
    await model.save();
  }

  private async find3DModels(
    { size, skip, sort }: PaginationDto,
    { categories, workspaceId, search }: Models3dRequestDto,
    user: UserEntity | undefined,
    asCurrent = false,
  ) {
    const sortItem = sort?.[0];
    const sortField = sortItem?.field ?? 'createdAt';
    const sortOrder = sortItem?.by ?? PaginationSortOrder.DESC;

    const qb = this.model3dRepository
      .createQueryBuilder('model')
      .innerJoinAndSelect('model.file', 'file')
      .innerJoinAndSelect('model.user', 'user')
      .innerJoinAndSelect('user.userMeta', 'userMeta')
      .leftJoinAndSelect('model.categories', 'category')
      .where('1=1')
      .orderBy(`model.${sortField}`, sortOrder);

    if (asCurrent && user) {
      qb.andWhere({ user: { id: user.id } });
    } else if (workspaceId) {
      qb.andWhere('model.workspaceId = :workspaceId', { workspaceId });
      // Workspace members see all visibility levels; non-members see only public
      const isMember = user ? await this.workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, user.id) : null;
      if (!isMember) {
        qb.andWhere({ visibility: ModelVisibility.Public });
      }
    } else {
      qb.andWhere({ visibility: ModelVisibility.Public });
    }

    if (categories?.length) qb.andWhere({ categories: In(categories) });

    const term = search?.trim();
    if (term) {
      qb.andWhere('model.name ILIKE :search', { search: `%${term}%` });
    }

    if (skip) qb.skip(skip);
    if (size) qb.take(size);

    return qb.getManyAndCount();
  }
}
