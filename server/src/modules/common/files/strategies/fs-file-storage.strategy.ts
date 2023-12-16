import { mkdir, writeFile, unlink } from 'fs/promises';
import { resolve, extname } from 'path';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@/modules/common/config/config.service';
import { IFileStorageStrategy } from '@/modules/common/files/types';

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

  private getAvatarFilePath(path: string): string {
    return resolve(process.cwd(), this.configService.fsConfig.folders.avatars, path);
  }
}
