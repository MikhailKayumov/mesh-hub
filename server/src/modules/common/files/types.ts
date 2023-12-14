export interface IFileStorageStrategy {
  init?: () => void | Promise<void>;
  getFile(filePath: string): Promise<Buffer>;
  saveFile(filePath: string, file: Buffer): Promise<string>;
  removeFile(filePath: string): Promise<void>;
}
