export interface IFileStorageStrategy {
  init?: () => void | Promise<void>;
  deleteFile(path: string, silent: boolean): Promise<void>;
  saveAvatar(name: string, file: Express.Multer.File): Promise<string>;
  removeAvatar(name: string): Promise<void>;
  save3DModel(id: string, file: Express.Multer.File): Promise<string>;
  save3DModelThumbnailFromBase64(id: string, thumbnail: string): Promise<string>;
  delete3DModel(id: string, silent: boolean): Promise<void>;
}
