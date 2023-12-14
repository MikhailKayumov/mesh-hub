import { mkdir, readFile, writeFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { ConfigService } from '@/modules/common/config/config.service';
import { IFileStorageStrategy } from '@/modules/common/files/types';

export class FsFileStorageStrategy implements IFileStorageStrategy {
  public constructor(private readonly configService: ConfigService) {}

  public async getFile(filePath: string): Promise<Buffer> {
    const fileFullPath = this.getFilePath(filePath);
    return readFile(fileFullPath);
  }

  public async saveFile(filePath: string, file: Buffer): Promise<string> {
    const fileFullPath = this.getFilePath(filePath);

    await mkdir(dirname(fileFullPath), { recursive: true });
    await writeFile(fileFullPath, file);

    return filePath;
  }

  public async removeFile(filePath: string): Promise<void> {
    const fileFullPath = this.getFilePath(filePath);
    return unlink(fileFullPath);
  }

  private getFilePath(filePath: string): string {
    console.log(process.cwd());
    return join('', filePath);
  }
}
