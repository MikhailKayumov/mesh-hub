import { rm } from 'fs/promises';
import { FileValidator, Injectable } from '@nestjs/common';
import formatBytes from '@/utils/format-bytes';

@Injectable()
export class FileSizeValidator extends FileValidator {
  public constructor(private readonly maxSizeBytes: number) {
    super({ maxSizeBytes });
  }

  isValid(file: Express.Multer.File): boolean {
    return file.size <= this.maxSizeBytes;
  }

  buildErrorMessage(file: Express.Multer.File): string {
    if (file.path && !file.buffer) {
      rm(file.path, { force: true });
    }

    return `Размер файла ${formatBytes(file.size)} больше допустимого ${formatBytes(this.maxSizeBytes)}`;
  }
}
