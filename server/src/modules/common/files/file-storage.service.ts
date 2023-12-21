import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@/modules/common/config/config.service';
import { FsFileStorageStrategy } from './strategies/fs-file-storage.strategy';
import { IFileStorageStrategy } from './types';

@Injectable()
export class FileStorageService implements OnApplicationBootstrap {
  private readonly strategy: IFileStorageStrategy;

  public constructor(private readonly configService: ConfigService) {
    this.strategy = new FsFileStorageStrategy(configService);
  }

  public async onApplicationBootstrap(): Promise<any> {
    await this.strategy.init?.();
  }

  public async deleteFile(path: string, silent = true): Promise<void> {
    this.strategy.deleteFile(path, silent);
  }

  public async saveAvatar(name: string, file: Express.Multer.File): Promise<string> {
    return this.strategy.saveAvatar(name, file);
  }

  public async removeAvatar(name: string): Promise<void> {
    return this.strategy.removeAvatar(name);
  }

  public async save3DModel(id: string, file: Express.Multer.File): Promise<string> {
    return this.strategy.save3DModel(id, file);
  }

  public async save3DModelThumbnailFromBase64(id: string, thumbnail: string): Promise<string> {
    return this.strategy.save3DModelThumbnailFromBase64(id, thumbnail);
  }

  public async delete3DModel(id: string, silent = true): Promise<void> {
    this.strategy.delete3DModel(id, silent);
  }
}
