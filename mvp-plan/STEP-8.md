# STEP-8 — S3 File Storage Strategy

**Block:** 2 — Quotas & S3
**Prerequisites:** STEP-7 (OrgSubscription entity must exist)
**Parallel with:** STEP-9/10/11 (embed blocks)

---

## Goal

Implement `S3FileStorageStrategy` for Growth-tier customers who provide their own S3 bucket.
Credentials are stored encrypted in `OrgSubscriptionEntity.storageConfigEncrypted`.
`FilesService` gains a per-org strategy selector.

---

## 1. New Dependency

In `server/package.json`, add:
```
@aws-sdk/client-s3
@aws-sdk/lib-storage   (for streaming multipart upload)
```

---

## 2. New Env Variable

**`server/.env` / `server/.env.example`:**
```
STORAGE_ENCRYPTION_KEY=  # 32-byte hex string (AES-256-CBC key)
```

Add to `ConfigService` (wherever it reads env vars):
```ts
get storageEncryptionKey(): string {
  return this.get<string>('STORAGE_ENCRYPTION_KEY');
}
```

---

## 3. Encryption Utility

**File:** `server/src/utils/encryption.ts`

```ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export function encryptAes256(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptAes256(ciphertext: string, keyHex: string): string {
  const [ivHex, dataHex] = ciphertext.split(':');
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}
```

Use only for credentials storage — never log decrypted values.

---

## 4. S3 Config Shape

```ts
// Stored as JSON, encrypted:
interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;  // for custom S3-compatible backends (MinIO etc.)
}
```

---

## 5. `S3FileStorageStrategy`

**File:** `server/src/modules/files/strategies/s3.files.strategy.ts`

Implements `IFileStorageStrategy`. Key implementation notes:

- `saveAvatar` — upload to `avatars/<name>` key.
- `save3DModel` — stream `file.buffer` or read from `file.path` to `models-3d/<modelId>/<filename>`.
- `save3DModelDirectory` — upload all `ExtractedFile[]` objects in parallel to
  `models-3d/<modelId>/<relativePath>`.
- `save3DModelThumbnailFromBase64` — decode base64, upload to `models-3d/<modelId>/thumbnail.png`.
- `delete3DModel` — list all objects with prefix `models-3d/<modelId>/`, delete them all
  (use `ListObjectsV2Command` + `DeleteObjectsCommand`).
- `deleteFile` — `DeleteObjectCommand`.
- File serving for S3: the `GET /models-3d/files/:modelId/*fileName` endpoint cannot
  `createReadStream` from S3 directly. Two options:
  - **Option A (MVP):** Generate a pre-signed S3 URL and return a 307 redirect.
  - **Option B:** Proxy through NestJS (memory-intensive).

  Use **Option A** — add method to strategy: `getFileUrl(path: string): Promise<string>`.
  Add to `IFileStorageStrategy`:
  ```ts
  getFileUrl(path: string): Promise<string | null>;
  // FsStrategy returns null (meaning serve locally)
  // S3Strategy returns pre-signed URL (60 min expiry)
  ```
  Update controller to redirect if URL is returned, otherwise stream.

---

## 6. `FilesService.getStrategyForOrg`

**File:** `server/src/modules/files/files.service.ts`

```ts
public async getStrategyForOrg(orgId: string): Promise<IFileStorageStrategy> {
  const sub = await this.storageQuotaService.getSubscription(orgId);

  if (sub.storageBackend === StorageBackend.S3 && sub.storageConfigEncrypted) {
    const configJson = decryptAes256(
      sub.storageConfigEncrypted,
      this.configService.storageEncryptionKey,
    );
    const config: S3StorageConfig = JSON.parse(configJson);
    return new S3FileStorageStrategy(config);
  }

  return this.localStrategy; // FsFileStorageStrategy (default)
}
```

The existing `this.strategy` field becomes `this.localStrategy`.
`FilesService` must inject `StorageQuotaService` (via `StorageQuotaModule`).

**Update upload flow** in `Model3dService` to call `filesService.getStrategyForOrg(orgId)`
and use the returned strategy for that upload. For orgs without a `workspaceId`
context (public uploads), fall back to local strategy.

---

## 7. Admin Endpoint to Set S3 Credentials

**File:** `server/src/modules/organizations/controllers/organization.controller.ts`

Add (admin only):
```ts
@Patch(':id/subscription/storage')
@OrgMemberRole(OrgMemberRole.Owner)
public async updateStorageConfig(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() body: UpdateStorageConfigDto,
): Promise<void>
```

`UpdateStorageConfigDto` fields: `storageBackend: StorageBackend`, `s3Config?: S3StorageConfig`.

Service: validate S3 credentials (optional — attempt a `HeadBucketCommand`); encrypt and store.

---

## Verification

1. Set org to S3 storage with valid credentials; upload a file → it appears in S3 bucket.
2. `GET /api/models-3d/files/<modelId>/<filename>` → 307 redirect to pre-signed URL.
3. Set org to local; upload → file in local `files/` directory.
4. Corrupt the `storageConfigEncrypted` → upload returns 500 with generic error (never expose decryption error details).
