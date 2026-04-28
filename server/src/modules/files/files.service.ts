import { extname } from 'path';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnApplicationBootstrap,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import AdmZip from 'adm-zip';
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
    const sub = await this.dataSource.getRepository(OrgSubscriptionEntity).findOne({ where: { orgId } });

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

  public async save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<void> {
    return this.localStrategy.save3DModelDirectory(modelId, files);
  }

  public async saveEmbedLogo(projectId: string, file: Express.Multer.File): Promise<string> {
    return this.localStrategy.saveEmbedLogo(projectId, file);
  }

  public async saveModelVersion(modelId: string, versionId: string, file: Express.Multer.File): Promise<void> {
    return this.localStrategy.saveModelVersion(modelId, versionId, file);
  }

  public async saveModelVersionDirectory(modelId: string, versionId: string, files: ExtractedFile[]): Promise<void> {
    return this.localStrategy.saveModelVersionDirectory(modelId, versionId, files);
  }

  public async deleteModelVersion(modelId: string, versionId: string): Promise<void> {
    return this.localStrategy.deleteModelVersion(modelId, versionId);
  }

  public async copyVersionToRoot(modelId: string, versionId: string, entryFile: string | undefined): Promise<void> {
    return this.localStrategy.copyVersionToRoot(modelId, versionId, entryFile);
  }

  public async saveModelVersionForOrg(
    orgId: string,
    modelId: string,
    versionId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const strategy = await this.getStrategyForOrg(orgId);
    return strategy.saveModelVersion(modelId, versionId, file);
  }

  public async saveModelVersionDirectoryForOrg(
    orgId: string,
    modelId: string,
    versionId: string,
    files: ExtractedFile[],
  ): Promise<void> {
    const strategy = await this.getStrategyForOrg(orgId);
    return strategy.saveModelVersionDirectory(modelId, versionId, files);
  }

  public async deleteModelVersionForOrg(orgId: string, modelId: string, versionId: string): Promise<void> {
    const strategy = await this.getStrategyForOrg(orgId);
    return strategy.deleteModelVersion(modelId, versionId);
  }

  public async copyVersionToRootForOrg(
    orgId: string,
    modelId: string,
    versionId: string,
    entryFile: string | undefined,
  ): Promise<void> {
    const strategy = await this.getStrategyForOrg(orgId);
    return strategy.copyVersionToRoot(modelId, versionId, entryFile);
  }

  public async saveSceneHdri(orgId: string, sceneId: string, file: Express.Multer.File): Promise<void> {
    const strategy = await this.getStrategyForOrg(orgId);
    return strategy.saveSceneHdri(sceneId, file);
  }

  public async saveSceneThumbnail(orgId: string, sceneId: string, buffer: Buffer): Promise<void> {
    const strategy = await this.getStrategyForOrg(orgId);
    return strategy.saveSceneThumbnail(sceneId, buffer);
  }

  public async deleteSceneFiles(orgId: string | null, sceneId: string): Promise<void> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.deleteSceneFiles(sceneId);
  }

  public async getSceneHdriUrl(orgId: string, sceneId: string): Promise<string | null> {
    const strategy = await this.getStrategyForOrg(orgId);
    return strategy.getFileUrl(`scenes/${sceneId}/environment.hdr`);
  }

  public async saveModelDisplayHdri(orgId: string | null, modelId: string, file: Express.Multer.File): Promise<void> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.saveModelDisplayHdri(modelId, file);
  }

  public async deleteModelDisplayHdri(orgId: string | null, modelId: string): Promise<void> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.deleteModelDisplayHdri(modelId);
  }

  public async getModelDisplayHdriUrl(orgId: string | null, modelId: string): Promise<string | null> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.getFileUrl(`models-3d/${modelId}/display-hdri.hdr`);
  }

  public async saveModelMaterialTexture(
    orgId: string | null,
    modelId: string,
    overrideId: string,
    type: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.saveModelMaterialTexture(modelId, overrideId, type, file);
  }

  public async deleteModelMaterialTexture(
    orgId: string | null,
    modelId: string,
    overrideId: string,
    type: string,
  ): Promise<void> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.deleteModelMaterialTexture(modelId, overrideId, type);
  }

  public async saveModelAudio(
    orgId: string | null,
    modelId: string,
    audioId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.saveModelAudio(modelId, audioId, file);
  }

  public async deleteModelAudio(orgId: string | null, modelId: string, filename: string): Promise<void> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.deleteModelAudio(modelId, filename);
  }

  public async getModelAudioUrl(orgId: string | null, modelId: string, filename: string): Promise<string | null> {
    const strategy = orgId ? await this.getStrategyForOrg(orgId) : this.localStrategy;
    return strategy.getFileUrl(`models-3d/${modelId}/audio/${filename}`);
  }

  public async extractAndSave3DModelDirectory(
    modelId: string,
    zipFile: Express.Multer.File,
  ): Promise<{ entryFile: string; format: string }> {
    const extractedFiles = this.extractZipForModel(zipFile);
    const { entryFile, format } = this.selectEntryFile(extractedFiles);

    await this.localStrategy.save3DModelDirectory(modelId, extractedFiles);

    return { entryFile, format };
  }

  public async extractAndSaveModelVersionDirectory(
    modelId: string,
    versionId: string,
    zipFile: Express.Multer.File,
    orgId?: string,
  ): Promise<{ entryFile: string; format: string }> {
    const extractedFiles = this.extractZipForModel(zipFile);
    const { entryFile, format } = this.selectEntryFile(extractedFiles);

    if (orgId) {
      await this.saveModelVersionDirectoryForOrg(orgId, modelId, versionId, extractedFiles);
    } else {
      await this.saveModelVersionDirectory(modelId, versionId, extractedFiles);
    }

    return { entryFile, format };
  }

  /** Validate, depth-check and extract zip entries used by both upload and version pipelines. */
  private extractZipForModel(zipFile: Express.Multer.File): ExtractedFile[] {
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
      '.obj',
      '.mtl',
      '.dae',
      '.fbx',
      '.stl',
      '.tga',
      '.bmp',
      '.tif',
      '.tiff',
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

      extractedFiles.push({ relativePath: name, buffer: entry.getData(), size: entry.header.size });
    }

    return extractedFiles;
  }

  /**
   * Pick the entry-point file from an extracted archive and derive the original format.
   * - GLTF and GLB are mutually exclusive — both present is an error.
   * - Only one entry-point format type may be present per archive.
   * - GLTF/GLB/FBX/DAE/STL: exactly one file required.
   * - OBJ: 1+ allowed; pick the largest by uncompressed size, ties broken lexicographically.
   */
  private selectEntryFile(files: ExtractedFile[]): { entryFile: string; format: string } {
    const buckets: Record<string, ExtractedFile[]> = {
      '.gltf': [],
      '.glb': [],
      '.fbx': [],
      '.obj': [],
      '.dae': [],
      '.stl': [],
    };

    for (const f of files) {
      const ext = extname(f.relativePath).toLowerCase();
      if (ext in buckets) {
        buckets[ext].push(f);
      }
    }

    if (buckets['.gltf'].length > 0 && buckets['.glb'].length > 0) {
      throw new BadRequestException('Archive contains both .gltf and .glb files — exactly one required');
    }

    // Treat gltf+glb as a single "gltf-family" type for mixed-format detection.
    const presentTypes: string[] = [];
    if (buckets['.gltf'].length > 0 || buckets['.glb'].length > 0) presentTypes.push('gltf-family');
    if (buckets['.fbx'].length > 0) presentTypes.push('.fbx');
    if (buckets['.obj'].length > 0) presentTypes.push('.obj');
    if (buckets['.dae'].length > 0) presentTypes.push('.dae');
    if (buckets['.stl'].length > 0) presentTypes.push('.stl');

    if (presentTypes.length > 1) {
      throw new BadRequestException('Archive contains multiple model formats');
    }

    if (presentTypes.length === 0) {
      throw new BadRequestException(
        'No supported 3D model entry file (.glb/.gltf/.fbx/.obj/.dae/.stl) found in archive',
      );
    }

    const exactlyOne = (ext: string): ExtractedFile => {
      const bucket = buckets[ext];
      if (bucket.length > 1) {
        throw new BadRequestException(`Archive contains multiple ${ext} files — exactly one required`);
      }
      return bucket[0];
    };

    const presentType = presentTypes[0];
    let chosen: ExtractedFile;
    let chosenExt: string;

    if (presentType === 'gltf-family') {
      const ext = buckets['.gltf'].length > 0 ? '.gltf' : '.glb';
      chosen = exactlyOne(ext);
      chosenExt = ext;
    } else if (presentType === '.obj') {
      chosen = [...buckets['.obj']].sort((a, b) => {
        if (b.size !== a.size) return b.size - a.size;
        return a.relativePath.localeCompare(b.relativePath);
      })[0];
      chosenExt = '.obj';
    } else {
      chosen = exactlyOne(presentType);
      chosenExt = presentType;
    }

    return { entryFile: chosen.relativePath, format: chosenExt.slice(1).toLowerCase() };
  }
}
