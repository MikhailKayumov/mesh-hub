import { IFileStorageStrategy } from '../types';

export class MockFileStorageStrategy implements IFileStorageStrategy {
  private store: Map<string, Buffer> = new Map();

  public getFile(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (!this.store.has(filePath)) {
        reject(new Error('File not found'));
        return;
      }

      resolve(this.store.get(filePath)!);
    });
  }

  public saveFile(filePath: string, file: Buffer): Promise<string> {
    return new Promise((resolve) => {
      this.store.set(filePath, file);
      resolve(filePath);
    });
  }

  public removeFile(filePath: string): Promise<void> {
    return new Promise((resolve) => {
      this.store.delete(filePath);
      resolve();
    });
  }
}
