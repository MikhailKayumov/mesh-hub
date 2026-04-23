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
  saveEmbedLogo(projectId: string, file: Express.Multer.File): Promise<string>;
  /**
   * Returns a URL that can be used to access the file.
   * - FsFileStorageStrategy returns `null` (file is served locally).
   * - S3FileStorageStrategy returns a pre-signed URL (307 redirect).
   */
  getFileUrl(relativePath: string): Promise<string | null>;
  /** Save a single .glb/.gltf file for a specific model version. */
  saveModelVersion(modelId: string, versionId: string, file: Express.Multer.File): Promise<void>;
  /** Save extracted ZIP contents for a specific model version. Returns the entryFile relative path. */
  saveModelVersionDirectory(modelId: string, versionId: string, files: ExtractedFile[]): Promise<string>;
  /** Delete all files associated with a specific model version. */
  deleteModelVersion(modelId: string, versionId: string): Promise<void>;
  /** Copy a version's files to the model root (used on activation). */
  copyVersionToRoot(modelId: string, versionId: string, entryFile: string | undefined): Promise<void>;
}
