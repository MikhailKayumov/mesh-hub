import { FileValidator, Injectable } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces/file.interface';
import formatBytes from '@/utils/format-bytes';

@Injectable()
export class FileSizeValidator extends FileValidator {
  constructor(private readonly maxSizeBytes: number) {
    super({ maxSizeBytes });
  }

  isValid(file: IFile): boolean {
    return file.size <= this.maxSizeBytes;
  }

  buildErrorMessage(file: IFile): string {
    return `Размер файла ${formatBytes(file.size)} больше допустимого ${formatBytes(this.maxSizeBytes)}`;
  }
}
