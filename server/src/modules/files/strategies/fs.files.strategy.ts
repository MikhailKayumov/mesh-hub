import { mkdir, writeFile, unlink, rename, rm, copyFile, readdir } from 'fs/promises';
import { resolve, extname, dirname, sep, basename } from 'path';
import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@/modules/config/config.service';
import { ExtractedFile, IFileStorageStrategy } from '@/modules/files/types';

export class FsFileStorageStrategy implements IFileStorageStrategy {
  private readonly logger = new Logger('FsFileStorageStrategy');

  public constructor(private readonly configService: ConfigService) {}

  public async init() {
    const { root, folders } = this.configService.fsConfig;

    this.logger.log('Create FS root folder');
    await mkdir(root, { recursive: true });
    this.logger.log('FS root folder was successfully created');

    await Promise.all(
      Object.entries(folders).map(async ([name, path]) => {
        this.logger.log(`Create FS folder "${name}"`);
        await mkdir(path, { recursive: true });
        this.logger.log(`FS folder "${name}" was successfully created`);
      }),
    );
  }

  public async deleteFile(path: string, silent = true): Promise<void> {
    await rm(path, { force: silent, recursive: true });
  }

  public async saveAvatar(name: string, file: Express.Multer.File): Promise<string> {
    const nameWithExt = `${name}${extname(file.originalname)}`;

    this.logger.debug(`Save avatar ${nameWithExt}`);
    await writeFile(this.getAvatarFilePath(nameWithExt), file.buffer);

    return nameWithExt;
  }

  public async removeAvatar(name: string): Promise<void> {
    this.logger.debug(`Remove avatar ${name}`);
    await unlink(this.getAvatarFilePath(name));
  }

  public async save3DModel(id: string, file: Express.Multer.File): Promise<string> {
    const path = this.get3DModelFilePath(id, file.originalname);
    const dir = dirname(path);

    await mkdir(dir, { recursive: true });
    await rename(file.path, path);

    return path;
  }

  public async save3DModelThumbnailFromBase64(id: string, thumbnail: string): Promise<string> {
    const base64Data = thumbnail.replace(/^data:image\/png;base64,/, '');

    await writeFile(this.get3DModelThumbnailFilePath(id), base64Data, 'base64');

    return 'thumbnail.png';
  }

  public async delete3DModel(id: string, silent = true): Promise<void> {
    return this.deleteFile(this.get3DModelFilePath(id), silent);
  }

  public async save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<string> {
    const modelDir = this.get3DModelFilePath(modelId);

    for (const f of files) {
      const target = resolve(modelDir, f.relativePath);
      if (!target.startsWith(modelDir + sep)) {
        throw new BadRequestException(`Invalid file path in archive: ${f.relativePath}`);
      }
    }

    for (const f of files) {
      const target = resolve(modelDir, f.relativePath);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, f.buffer);
    }

    const entryFile = files.find((f) => /\.(gltf|glb)$/i.test(f.relativePath));
    if (!entryFile) {
      throw new BadRequestException('No .gltf or .glb entry point found in archive');
    }
    return entryFile.relativePath;
  }

  public async saveEmbedLogo(projectId: string, file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname);
    const fileName = `logo${ext}`;
    const dir = resolve(process.cwd(), this.configService.fsConfig.folders.embed, projectId);
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, fileName), file.buffer);
    return `${projectId}/${fileName}`;
  }

  private getAvatarFilePath(path: string): string {
    return resolve(process.cwd(), this.configService.fsConfig.folders.avatars, path);
  }

  private get3DModelFilePath(id: string, name?: string): string {
    return resolve(process.cwd(), this.configService.fsConfig.folders.models, id, name ?? '');
  }

  private get3DModelThumbnailFilePath(id: string): string {
    return resolve(process.cwd(), this.configService.fsConfig.folders.models, id, 'thumbnail.png');
  }

  public async getFileUrl(_relativePath: string): Promise<string | null> {
    return Promise.resolve(_relativePath);
  }

  public async saveModelVersion(modelId: string, versionId: string, file: Express.Multer.File): Promise<void> {
    const dir = this.getVersionDirPath(modelId, versionId);
    await mkdir(dir, { recursive: true });
    await rename(file.path, resolve(dir, file.originalname));
  }

  public async saveModelVersionDirectory(modelId: string, versionId: string, files: ExtractedFile[]): Promise<string> {
    const versionDir = this.getVersionDirPath(modelId, versionId);

    for (const f of files) {
      const target = resolve(versionDir, f.relativePath);
      if (!target.startsWith(versionDir + sep)) {
        throw new BadRequestException(`Invalid file path in archive: ${f.relativePath}`);
      }
    }

    for (const f of files) {
      const target = resolve(versionDir, f.relativePath);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, f.buffer);
    }

    const entryFile = files.find((f) => /\.(gltf|glb)$/i.test(f.relativePath));
    if (!entryFile) {
      throw new BadRequestException('No .gltf or .glb entry point found in archive');
    }
    return entryFile.relativePath;
  }

  public async deleteModelVersion(modelId: string, versionId: string): Promise<void> {
    await rm(this.getVersionDirPath(modelId, versionId), { recursive: true, force: true });
  }

  public async copyVersionToRoot(modelId: string, versionId: string, _entryFile: string | undefined): Promise<void> {
    const versionDir = this.getVersionDirPath(modelId, versionId);
    const modelDir = this.get3DModelFilePath(modelId);

    const entries = await readdir(versionDir);
    for (const entry of entries) {
      const src = resolve(versionDir, entry);
      const dest = resolve(modelDir, basename(entry));
      if (!dest.startsWith(modelDir + sep)) continue; // safety check
      await copyFile(src, dest);
    }
  }

  private getVersionDirPath(modelId: string, versionId: string): string {
    return resolve(process.cwd(), this.configService.fsConfig.folders.models, modelId, 'versions', versionId);
  }

  public async saveSceneHdri(sceneId: string, file: Express.Multer.File): Promise<void> {
    const dir = this.getSceneDirPath(sceneId);
    await mkdir(dir, { recursive: true });
    const dest = resolve(dir, 'environment.hdr');
    if (file.path) {
      await rename(file.path, dest);
    } else {
      await writeFile(dest, file.buffer);
    }
  }

  public async saveSceneThumbnail(sceneId: string, buffer: Buffer): Promise<void> {
    const dir = this.getSceneDirPath(sceneId);
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, 'thumbnail.png'), buffer);
  }

  public async deleteSceneFiles(sceneId: string): Promise<void> {
    await rm(this.getSceneDirPath(sceneId), { recursive: true, force: true });
  }

  private getSceneDirPath(sceneId: string): string {
    return resolve(process.cwd(), 'files', 'scenes', sceneId);
  }

  public async saveModelDisplayHdri(modelId: string, file: Express.Multer.File): Promise<void> {
    const dir = resolve(process.cwd(), this.configService.fsConfig.folders.models, modelId);
    await mkdir(dir, { recursive: true });
    const dest = resolve(dir, 'display-hdri.hdr');
    if (file.path) {
      await rename(file.path, dest);
    } else {
      await writeFile(dest, file.buffer);
    }
  }

  public async deleteModelDisplayHdri(modelId: string): Promise<void> {
    const dest = resolve(process.cwd(), this.configService.fsConfig.folders.models, modelId, 'display-hdri.hdr');
    await rm(dest, { force: true });
  }

  public async saveModelMaterialTexture(
    modelId: string,
    overrideId: string,
    type: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const ext = extname(file.originalname) || '.png';
    const dir = resolve(process.cwd(), this.configService.fsConfig.folders.models, modelId, 'materials', overrideId);
    await mkdir(dir, { recursive: true });
    const dest = resolve(dir, `${type}${ext}`);
    if (file.path) {
      await rename(file.path, dest);
    } else {
      await writeFile(dest, file.buffer);
    }
  }

  public async deleteModelMaterialTexture(modelId: string, overrideId: string, type: string): Promise<void> {
    const dir = resolve(process.cwd(), this.configService.fsConfig.folders.models, modelId, 'materials', overrideId);
    // Remove any file matching the type regardless of extension
    const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
    await Promise.all(extensions.map((ext) => rm(resolve(dir, `${type}${ext}`), { force: true })));
  }
}
