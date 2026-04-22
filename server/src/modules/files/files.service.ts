import { extname } from 'path';
import { Injectable, InternalServerErrorException, Logger, OnApplicationBootstrap, BadRequestException } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrgSubscriptionEntity, StorageBackend } from '@/database/entities/organizations/org-subscription.entity';
import { ConfigService } from '@/modules/config/config.service';
import { decryptAes256 } from '@/utils/encryption';
import { FsFileStorageStrategy } from './strategies/fs.files.strategy';
import { S3FileStorageStrategy } from './strategies/s3.files.strategy';
import { ExtractedFile, IFileStorageStrategy, S3StorageConfig } from './types';

@Injectable()
export class FilesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FilesService.name);
  private readonly localStrategy: IFileStorageStrategy;

  public constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.localStrategy = new FsFileStorageStrategy(configService);
  }

  public async onApplicationBootstrap(): Promise<any> {
    await this.localStrategy.init?.();
  }

  public async getStrategyForOrg(orgId: string): Promise<IFileStorageStrategy> {
    const sub = await this.dataSource
      .getRepository(OrgSubscriptionEntity)
      .findOne({ where: { orgId } });

    if (sub?.storageBackend === StorageBackend.S3 && sub.storageConfigEncrypted) {
      try {
        const encKey = this.configService.storageEncryptionKey;
        const configJson = decryptAes256(sub.storageConfigEncrypted, encKey);
        const config: S3StorageConfig = JSON.parse(configJson) as S3StorageConfig;
        return new S3FileStorageStrategy(config);
      } catch {
        this.logger.error(`Failed to decrypt S3 config for org ${orgId}`);
        throw new InternalServerErrorException('File storage configuration error');
      }
    }

    return this.localStrategy;
  }

  public async deleteFile(path: string, silent = true): Promise<void> {
    return this.localStrategy.deleteFile(path, silent);
  }

  public async saveAvatar(name: string, file: Express.Multer.File): Promise<string> {
    return this.localStrategy.saveAvatar(name, file);
  }

  public async removeAvatar(name: string): Promise<void> {
    return this.localStrategy.removeAvatar(name);
  }

  public async save3DModel(id: string, file: Express.Multer.File): Promise<string> {
    return this.localStrategy.save3DModel(id, file);
  }

  public async save3DModelThumbnailFromBase64(id: string, thumbnail: string): Promise<string> {
    return this.localStrategy.save3DModelThumbnailFromBase64(id, thumbnail);
  }

  public async delete3DModel(id: string, silent = true): Promise<void> {
    return this.localStrategy.delete3DModel(id, silent);
  }

  public async save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<string> {
    return this.localStrategy.save3DModelDirectory(modelId, files);
  }

  public async extractAndSave3DModelDirectory(modelId: string, zipFile: Express.Multer.File): Promise<string> {
    const ALLOWED_EXTENSIONS = new Set([
      '.gltf',
      '.glb',
      '.bin',
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.ktx2',
      '.mp3',
      '.ogg',
      '.wav',
    ]);

    const MAX_UNCOMPRESSED = 1024 ** 3 * 3; // 3 GB
    let totalSize = 0;

    const zip = new AdmZip(zipFile.path);
    const entries = zip.getEntries();
    const extractedFiles: ExtractedFile[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const name = entry.entryName;
      const depth = name.split('/').length - 1;
      if (depth > 1) {
        throw new BadRequestException(`Archive contains files more than 1 level deep: ${name}`);
      }

      const ext = extname(name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new BadRequestException(`Archive contains disallowed file type: ${ext}`);
      }

      totalSize += entry.header.size;
      if (totalSize > MAX_UNCOMPRESSED) {
        throw new BadRequestException('Archive uncompressed size exceeds 3 GB limit');
      }

      extractedFiles.push({ relativePath: name, buffer: entry.getData() });
    }

    const entryPoints = extractedFiles.filter((f) => /\.(gltf|glb)$/i.test(f.relativePath));
    if (entryPoints.length === 0) {
      throw new BadRequestException('No .gltf or .glb file found in archive');
    }
    if (entryPoints.length > 1) {
      throw new BadRequestException('Archive contains multiple .gltf/.glb files — exactly one required');
    }

    return this.strategy.save3DModelDirectory(modelId, extractedFiles);
  }
}
