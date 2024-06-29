import { rm } from 'fs/promises';
import { extname } from 'path';
import { FileValidator, Injectable } from '@nestjs/common';

@Injectable()
export class FileExtensionValidatorPipe extends FileValidator {
  public constructor(private readonly extensions: string[]) {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    return this.extensions.includes(extname(file.originalname));
  }

  buildErrorMessage(file: Express.Multer.File): string {
    if (file.path && !file.buffer) {
      rm(file.path, { force: true });
    }

    const types = this.extensions.map((i) => i.substring(1).toUpperCase()).join(', ');
    return `Не верный тип файла модели, допустимые типы файлов: ${types}`;
  }
}
