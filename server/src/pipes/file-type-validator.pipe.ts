import { rm } from 'fs/promises';
import { FileValidator, Injectable } from '@nestjs/common';

@Injectable()
export class FileTypeValidator extends FileValidator {
  public constructor(private readonly mimeTypes: string[]) {
    super({ mimeTypes });
  }

  isValid(file: Express.Multer.File): boolean {
    return this.mimeTypes.includes(file.mimetype);
  }

  buildErrorMessage(file: Express.Multer.File): string {
    if (file.path && !file.buffer) {
      rm(file.path, { force: true });
    }

    return `Не верный тип файла ${file.mimetype}, допустимые типы файлов: ${this.mimeTypes.join(', ')}`;
  }
}
