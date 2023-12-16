export interface IFileStorageStrategy {
  init?: () => void | Promise<void>;
  saveAvatar(name: string, file: Express.Multer.File): Promise<string>;
  removeAvatar(name: string): Promise<void>;
}
