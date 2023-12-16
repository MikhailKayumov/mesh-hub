import { FileValidator, Injectable } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces/file.interface';

@Injectable()
export class FileTypeValidator extends FileValidator {
  constructor(private readonly mimeTypes: string[]) {
    super({ mimeTypes });
  }

  isValid(value: IFile): boolean {
    return this.mimeTypes.includes(value.mimetype);
  }

  buildErrorMessage(file: IFile): string {
    return `Не верный тип файла ${file.mimetype}, допустимые типы файлов: ${this.mimeTypes.join(', ')}`;
  }
}
