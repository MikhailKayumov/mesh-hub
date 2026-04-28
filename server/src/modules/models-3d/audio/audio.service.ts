import { createReadStream, existsSync } from 'fs';
import { resolve } from 'path';
import { ForbiddenException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ModelVisibility } from '@/constants';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { FilesService } from '@/modules/files/files.service';
import { ConfigService } from '@/modules/config/config.service';
import { Model3dRepository } from '@/modules/models-3d/repositories/model-3d.repository';
import { ModelAudioResponseDto } from './dto/model-audio.response.dto';
import { ModelAudioRepository } from './model-audio.repository';

@Injectable()
export class AudioService {
  public constructor(
    private readonly filesService: FilesService,
    private readonly model3dRepository: Model3dRepository,
    private readonly modelAudioRepository: ModelAudioRepository,
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  public async list(modelId: string, user: UserEntity): Promise<ModelAudioResponseDto[]> {
    await this.loadModel(modelId, user);
    const tracks = await this.modelAudioRepository.findByModel(modelId);
    return tracks.map((t) => this.toResponse(t));
  }

  public async upload(
    modelId: string,
    user: UserEntity,
    file: Express.Multer.File,
  ): Promise<ModelAudioResponseDto> {
    const model = await this.loadModel(modelId, user);
    const orgId = await this.resolveOrgId(model);

    // Create entity first to get the ID for the filename
    const track = await this.modelAudioRepository.create({
      modelId,
      filename: file.originalname, // temporary, overwritten below
      originalName: file.originalname,
    });

    const filename = await this.filesService.saveModelAudio(orgId, modelId, track.id, file);
    track.filename = filename;
    const saved = await this.modelAudioRepository.save(track);

    return this.toResponse(saved);
  }

  public async streamAudio(
    modelId: string,
    audioId: string,
    user: UserEntity | null,
  ): Promise<StreamableFile | { redirect: string }> {
    const model = await this.loadModelForRead(modelId, user);
    const orgId = await this.resolveOrgId(model);
    const track = await this.modelAudioRepository.findOneByModelAndId(modelId, audioId);
    if (!track) throw new NotFoundException('Audio track not found');

    const url = await this.filesService.getModelAudioUrl(orgId, modelId, track.filename);
    if (url) {
      return { redirect: url };
    }

    // Local FS fallback
    const filePath = resolve(
      process.cwd(),
      this.configService.fsConfig.folders.models,
      modelId,
      'audio',
      track.filename,
    );
    if (!existsSync(filePath)) throw new NotFoundException('Audio file not found on disk');
    return new StreamableFile(createReadStream(filePath), { type: 'audio/mpeg', disposition: `inline; filename="${track.filename}"` });
  }

  public async remove(modelId: string, audioId: string, user: UserEntity): Promise<void> {
    const model = await this.loadModel(modelId, user);
    const orgId = await this.resolveOrgId(model);

    const track = await this.modelAudioRepository.findOneByModelAndId(modelId, audioId);
    if (!track) throw new NotFoundException('Audio track not found');

    await this.filesService.deleteModelAudio(orgId, modelId, track.filename);
    await this.modelAudioRepository.softDelete(audioId);
  }

  private async loadModel(modelId: string, user: UserEntity): Promise<Model3dEntity> {
    const model = await this.model3dRepository.findOne({
      where: { id: modelId },
      relations: { user: true },
    });
    if (!model) throw new NotFoundException('Model not found');
    if (model.user?.id !== user.id) throw new ForbiddenException('No access to this model');
    return model;
  }

  private async loadModelForRead(modelId: string, user: UserEntity | null): Promise<Model3dEntity> {
    const model = await this.model3dRepository.findOne({
      where: { id: modelId },
      relations: { user: true },
    });
    if (!model) throw new NotFoundException('Model not found');
    if (model.visibility === ModelVisibility.Public || model.visibility === ModelVisibility.Unlisted) return model;
    if (user && model.user?.id === user.id) return model;
    throw new ForbiddenException('No access to this model');
  }

  private async resolveOrgId(model: Model3dEntity): Promise<string | null> {
    if (!model.workspaceId) return null;
    const workspace = await this.dataSource
      .getRepository(WorkspaceEntity)
      .findOne({ where: { id: model.workspaceId } });
    return workspace?.orgId ?? null;
  }

  private toResponse(track: { id: string; modelId: string; filename: string; originalName: string; durationS?: number | null; createdAt: Date }): ModelAudioResponseDto {
    return {
      id: track.id,
      modelId: track.modelId,
      filename: track.filename,
      originalName: track.originalName,
      durationS: track.durationS ?? null,
      createdAt: track.createdAt,
    };
  }
}
