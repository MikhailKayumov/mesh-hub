import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@/modules/common/config/config.service';
import { FsFileStorageStrategy } from './strategies/fs-file-storage.strategy';
import { MockFileStorageStrategy } from './strategies/mock-file-storage.strategy';
import { IFileStorageStrategy } from './types';

@Injectable()
export class FileStorageService implements OnApplicationBootstrap {
  private readonly strategy: IFileStorageStrategy;

  public constructor(private readonly configService: ConfigService) {
    this.strategy = configService.isTest ? new MockFileStorageStrategy() : new FsFileStorageStrategy(configService);
  }

  public async onApplicationBootstrap(): Promise<any> {
    await this.strategy.init?.();
  }

  // public getFile(filePath: string): Promise<Buffer> {
  // return this.fileStorageProvider.getFile(filePath);
  // }

  // public saveFile(filePath: string, file: Buffer): Promise<string> {
  // return this.fileStorageProvider.uploadFile(filePath, file);
  // }

  // public deleteFile(filePath: string): Promise<void> {
  // return this.fileStorageProvider.deleteFile(filePath);
  // }

  // public getFileName(file: Express.Multer.File): string | null {
  //     const ext = path.extname(file.originalname);
  //     if (!ext) {
  //         return null;
  //     }
  //     const uuid = newGuid();
  //     const nowMs = new Date().getTime();
  //     return `${uuid}_${nowMs}.${ext}`;
  // }
}
