import { rm } from 'fs/promises';
import { extname } from 'path';
import { FileValidator, Injectable } from '@nestjs/common';
import formatBytes from '@/utils/format-bytes';

@Injectable()
export class FileSizeValidator extends FileValidator {
  private readonly sizeMap?: Record<string, number>;
  private readonly singleMaxSize?: number;
  private readonly defaultSizeBytes?: number;

  public constructor(maxSize: number | Record<string, number>, defaultSizeBytes?: number) {
    const isMap = typeof maxSize === 'object' && maxSize !== null;
    // Parent metadata uses the largest configured limit for the Record form so it stays sane.
    const parentMax = isMap ? Math.max(defaultSizeBytes ?? 0, ...Object.values(maxSize)) : maxSize;
    super({ maxSizeBytes: parentMax });

    if (isMap) {
      this.sizeMap = maxSize;
      this.defaultSizeBytes = defaultSizeBytes;
    } else {
      this.singleMaxSize = maxSize;
    }
  }

  private resolveLimit(file: Express.Multer.File): number {
    if (this.sizeMap) {
      const ext = extname(file.originalname).toLowerCase();
      return this.sizeMap[ext] ?? this.defaultSizeBytes ?? Infinity;
    }
    return this.singleMaxSize ?? Infinity;
  }

  isValid(file: Express.Multer.File): boolean {
    return file.size <= this.resolveLimit(file);
  }

  buildErrorMessage(file: Express.Multer.File): string {
    if (file.path && !file.buffer) {
      rm(file.path, { force: true });
    }

    const limit = this.resolveLimit(file);
    return `Размер файла ${formatBytes(file.size)} больше допустимого ${formatBytes(limit)}`;
  }
}
