import { ErrorCode, FileError } from 'react-dropzone-esm';
import { ACCEPTED_3D_MODEL_FILE_TYPES, MAX_3D_MODEL_FILE_SIZE } from '@/constants';
import { formatBytes } from '@/utils/format-bytes.ts';

export function validate3DModelFile(file: File | DataTransferItem): FileError | null {
  if (file instanceof DataTransferItem) return null;

  if (file.size > MAX_3D_MODEL_FILE_SIZE) {
    return {
      code: ErrorCode.FileTooLarge,
      message: `Размер файла ${formatBytes(file.size)} больше допустимого ${formatBytes(MAX_3D_MODEL_FILE_SIZE)}`,
    };
  }

  const extension = file.name.substring(file.name.lastIndexOf('.'));
  if (!ACCEPTED_3D_MODEL_FILE_TYPES.includes(extension)) {
    const types = ACCEPTED_3D_MODEL_FILE_TYPES.map((i) => i.substring(1).toUpperCase()).join(', ');

    return {
      code: ErrorCode.FileInvalidType,
      message: `Недопустимый формат файла модели. Допустимые форматы ${types}`,
    };
  }

  return null;
}
