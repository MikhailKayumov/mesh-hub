import { extname } from 'path';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { Model3dFileEntity } from '@/database/entities/models-3d/model-3d-file.entity';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { PaginationDto, PaginationResponseDto } from '@/decorators/pagination';
import { FileStorageService } from '@/modules/common/files/file-storage.service';
import { CategoryRepository } from '@/modules/common/resources/repositories/category.repository';
import { Model3dResponseDto } from '@/modules/models-3d/dto/model-3d.response.dto';
import { Model3dUpdateRequestDto } from '@/modules/models-3d/dto/model-3d.update.request.dto';
import { Models3dRequestDto } from '@/modules/models-3d/dto/models-3d.request.dto';
import { Model3dMapper } from '@/modules/models-3d/mappers/model-3d.mapper';
import { Model3dFileRepository } from '@/modules/models-3d/repositories/model-3d-file.repository';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';

@Injectable()
export class Model3dService {
  private readonly logger = new Logger(Model3dService.name);

  public constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly model3dRepository: Model3dRepository,
    private readonly model3dFileRepository: Model3dFileRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

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

  public async upload3DModel(user: UserEntity, file: Express.Multer.File): Promise<{ modelId: string }> {
    let savedFileId: string = '';

    try {
      const model = await this.model3dRepository.manager.transaction(async (em) => {
        const fileEntity = new Model3dFileEntity();
        fileEntity.name = file.originalname;
        fileEntity.size = file.size;
        fileEntity.extension = extname(file.originalname);

        const createdFileEntity = await em.save(fileEntity);
        await this.fileStorageService.save3DModel(createdFileEntity.id, file);
        savedFileId = createdFileEntity.id;

        const modelEntity = new Model3dEntity();
        modelEntity.user = user;
        modelEntity.name = file.originalname.substring(0, file.originalname.lastIndexOf('.')).trim();
        modelEntity.file = fileEntity;

        return em.save(modelEntity);
      });

      return {
        modelId: model.id,
      };
    } catch (e) {
      this.logger.error(e);

      if (savedFileId) {
        this.fileStorageService.delete3DModel(savedFileId);
      } else {
        this.fileStorageService.deleteFile(file.path);
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
      await this.fileStorageService.delete3DModel(model.file.id, false);
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

    model.thumbnail = await this.fileStorageService.save3DModelThumbnailFromBase64(model.file.id, thumbnail);
    model.save();
  }

  private async find3DModels(
    { size, skip }: PaginationDto,
    { search, categories }: Models3dRequestDto,
    user: UserEntity | undefined,
    asCurrent = false,
  ) {
    const qb = this.model3dRepository
      .createQueryBuilder('model')
      .innerJoinAndSelect('model.file', 'file')
      .innerJoinAndSelect('model.user', 'user')
      .innerJoinAndSelect('user.userMeta', 'userMeta')
      .leftJoinAndSelect('model.categories', 'category')
      .where('1=1')
      .orderBy('model.createdAt', 'DESC');

    if (asCurrent && user) qb.andWhere({ user: { id: user.id } });
    else qb.andWhere({ isVisible: true });

    if (categories?.length) qb.andWhere({ categories: In(categories) });

    if (skip) qb.skip(skip);
    if (size) qb.take(size);

    return qb.getManyAndCount();
  }
}
