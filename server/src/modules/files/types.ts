export interface ExtractedFile {
  relativePath: string;
  buffer: Buffer;
}

export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Optional custom endpoint for S3-compatible backends (e.g. MinIO) */
  endpoint?: string;
}

export interface IFileStorageStrategy {
  init?: () => void | Promise<void>;
  deleteFile(path: string, silent: boolean): Promise<void>;
  saveAvatar(name: string, file: Express.Multer.File): Promise<string>;
  removeAvatar(name: string): Promise<void>;
  save3DModel(id: string, file: Express.Multer.File): Promise<string>;
  save3DModelThumbnailFromBase64(id: string, thumbnail: string): Promise<string>;
  delete3DModel(id: string, silent: boolean): Promise<void>;
  save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<string>;
  /**
   * Returns a URL that can be used to access the file.
   * - FsFileStorageStrategy returns `null` (file is served locally).
   * - S3FileStorageStrategy returns a pre-signed URL (307 redirect).
   */
  getFileUrl(relativePath: string): Promise<string | null>;
}
