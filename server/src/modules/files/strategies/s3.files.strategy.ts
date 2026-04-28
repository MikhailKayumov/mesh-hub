import { createReadStream } from 'fs';
import { extname, basename } from 'path';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ExtractedFile, IFileStorageStrategy, S3StorageConfig } from '@/modules/files/types';

const PRESIGNED_URL_TTL_SECONDS = 3600;

export class S3FileStorageStrategy implements IFileStorageStrategy {
  private readonly client: S3Client;
  private readonly bucket: string;

  public constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
    });
  }

  public async saveAvatar(name: string, file: Express.Multer.File): Promise<string> {
    const key = `avatars/${name}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return name;
  }

  public async removeAvatar(name: string): Promise<void> {
    await this.deleteKey(`avatars/${name}`);
  }

  public async save3DModel(modelId: string, file: Express.Multer.File): Promise<string> {
    const key = `models-3d/${modelId}/${file.originalname}`;
    const body = file.buffer ? Readable.from(file.buffer) : Readable.from(createReadStream(file.path));

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: file.mimetype,
      },
    });
    await upload.done();
    return key;
  }

  public async save3DModelDirectory(modelId: string, files: ExtractedFile[]): Promise<string> {
    await Promise.all(
      files.map((f) =>
        this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: `models-3d/${modelId}/${f.relativePath}`,
            Body: f.buffer,
          }),
        ),
      ),
    );

    const entryFile = files.find((f) => /\.(gltf|glb)$/i.test(f.relativePath));
    if (!entryFile) {
      throw new Error('No .gltf or .glb entry point found in archive');
    }
    return entryFile.relativePath;
  }

  public async saveEmbedLogo(projectId: string, file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname);
    const key = `embed/${projectId}/logo${ext}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return key;
  }

  public async save3DModelThumbnailFromBase64(modelId: string, thumbnail: string): Promise<string> {
    const base64Data = thumbnail.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: `models-3d/${modelId}/thumbnail.png`,
        Body: buffer,
        ContentType: 'image/png',
      }),
    );
    return 'thumbnail.png';
  }

  public async delete3DModel(modelId: string, silent = true): Promise<void> {
    try {
      const prefix = `models-3d/${modelId}/`;
      let continuationToken: string | undefined;

      do {
        const list = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );

        const objects = list.Contents ?? [];
        if (objects.length > 0) {
          await this.client.send(
            new DeleteObjectsCommand({
              Bucket: this.bucket,
              Delete: { Objects: objects.map((o) => ({ Key: o.Key! })) },
            }),
          );
        }

        continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
      } while (continuationToken);
    } catch (e) {
      if (!silent) throw e;
    }
  }

  public async deleteFile(path: string, silent = true): Promise<void> {
    await this.deleteKey(path, silent);
  }

  public async getFileUrl(relativePath: string): Promise<string | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: relativePath,
    });
    return getSignedUrl(this.client, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS });
  }

  private async deleteKey(key: string, silent = true): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (e) {
      if (!silent) throw e;
    }
  }

  public async saveModelVersion(modelId: string, versionId: string, file: Express.Multer.File): Promise<void> {
    const key = `models-3d/${modelId}/versions/${versionId}/${file.originalname}`;
    const body = file.buffer ? Readable.from(file.buffer) : Readable.from(createReadStream(file.path));

    const upload = new (await import('@aws-sdk/lib-storage')).Upload({
      client: this.client,
      params: { Bucket: this.bucket, Key: key, Body: body, ContentType: file.mimetype },
    });
    await upload.done();
  }

  public async saveModelVersionDirectory(modelId: string, versionId: string, files: ExtractedFile[]): Promise<string> {
    await Promise.all(
      files.map((f) =>
        this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: `models-3d/${modelId}/versions/${versionId}/${f.relativePath}`,
            Body: f.buffer,
          }),
        ),
      ),
    );

    const entryFile = files.find((f) => /\.(gltf|glb)$/i.test(f.relativePath));
    if (!entryFile) throw new Error('No .gltf or .glb entry point found in archive');
    return entryFile.relativePath;
  }

  public async deleteModelVersion(modelId: string, versionId: string): Promise<void> {
    const prefix = `models-3d/${modelId}/versions/${versionId}/`;
    let continuationToken: string | undefined;

    do {
      const list = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }),
      );
      const objects = list.Contents ?? [];
      if (objects.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: objects.map((o) => ({ Key: o.Key! })) },
          }),
        );
      }
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  public async copyVersionToRoot(modelId: string, versionId: string, _entryFile: string | undefined): Promise<void> {
    const prefix = `models-3d/${modelId}/versions/${versionId}/`;
    let continuationToken: string | undefined;

    do {
      const list = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }),
      );
      const objects = list.Contents ?? [];

      await Promise.all(
        objects.map((o) => {
          const destKey = `models-3d/${modelId}/${basename(o.Key!)}`;
          return this.client.send(
            new CopyObjectCommand({
              Bucket: this.bucket,
              CopySource: `${this.bucket}/${o.Key!}`,
              Key: destKey,
            }),
          );
        }),
      );

      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  public async saveSceneHdri(sceneId: string, file: Express.Multer.File): Promise<void> {
    const key = `scenes/${sceneId}/environment.hdr`;
    const body = file.buffer ? Readable.from(file.buffer) : Readable.from(createReadStream(file.path));
    const upload = new Upload({
      client: this.client,
      params: { Bucket: this.bucket, Key: key, Body: body, ContentType: 'application/octet-stream' },
    });
    await upload.done();
  }

  public async saveSceneThumbnail(sceneId: string, buffer: Buffer): Promise<void> {
    const key = `scenes/${sceneId}/thumbnail.png`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      }),
    );
  }

  public async deleteSceneFiles(sceneId: string): Promise<void> {
    const prefix = `scenes/${sceneId}/`;
    let continuationToken: string | undefined;

    do {
      const list = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }),
      );
      const objects = list.Contents ?? [];
      if (objects.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: objects.map((o) => ({ Key: o.Key! })) },
          }),
        );
      }
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  public async saveModelDisplayHdri(modelId: string, file: Express.Multer.File): Promise<void> {
    const key = `models-3d/${modelId}/display-hdri.hdr`;
    const body = file.buffer ? Readable.from(file.buffer) : Readable.from(createReadStream(file.path));
    const upload = new Upload({
      client: this.client,
      params: { Bucket: this.bucket, Key: key, Body: body, ContentType: 'application/octet-stream' },
    });
    await upload.done();
  }

  public async deleteModelDisplayHdri(modelId: string): Promise<void> {
    await this.deleteKey(`models-3d/${modelId}/display-hdri.hdr`);
  }

  public async saveModelMaterialTexture(
    modelId: string,
    overrideId: string,
    type: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const ext = extname(file.originalname) || '.png';
    const key = `models-3d/${modelId}/materials/${overrideId}/${type}${ext}`;
    const body = file.buffer ? Readable.from(file.buffer) : Readable.from(createReadStream(file.path));
    const upload = new Upload({
      client: this.client,
      params: { Bucket: this.bucket, Key: key, Body: body, ContentType: file.mimetype },
    });
    await upload.done();
  }

  public async deleteModelMaterialTexture(modelId: string, overrideId: string, type: string): Promise<void> {
    // Delete all extensions for the given type
    const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
    await Promise.all(
      extensions.map((ext) =>
        this.deleteKey(`models-3d/${modelId}/materials/${overrideId}/${type}${ext}`, true),
      ),
    );
  }
}
