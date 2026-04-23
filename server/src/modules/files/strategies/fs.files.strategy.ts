import { mkdir, writeFile, unlink, rename, rm } from 'fs/promises';
import { resolve, extname, dirname, sep } from 'path';
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
}
