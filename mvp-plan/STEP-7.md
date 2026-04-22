# STEP-7 — Storage Quotas + OrgSubscription Service

**Block:** 2 — Quotas
**Prerequisites:** STEP-2 (org service running), STEP-3
**Parallel with:** STEP-8 (S3 can be implemented in parallel)

---

## Goal

Implement storage and seats quota enforcement.
Create a standalone `StorageQuotaModule` to avoid circular dependencies between
`OrganizationsModule` and `Models3dModule`.

---

## 1. `StorageQuotaModule`

**Directory:** `server/src/modules/storage-quota/`

```
storage-quota/
├── storage-quota.module.ts
└── storage-quota.service.ts
```

### Why a separate module

`OrganizationsModule.OrgSubscriptionService` needs to query `model_3d_file.size` (owned by
`Models3dModule`). `Models3dModule` needs quota checks from `OrganizationsModule`.
Solution: both import `StorageQuotaModule` which owns neither entity but queries both.

### `StorageQuotaService`

Inject: `OrgSubscriptionRepository` + raw `DataSource` or `Model3dFileRepository` (exported
from `Models3dModule`). Use `DataSource` to avoid the circular import:

```ts
// server/src/modules/storage-quota/storage-quota.service.ts

@Injectable()
export class StorageQuotaService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getStorageUsed(orgId: string): Promise<number> {
    // SUM of all model_3d_file.size for models in this org's workspaces
    const result = await this.dataSource.query(`
      SELECT COALESCE(SUM(f.size), 0)::bigint AS total
      FROM model_3d.model_3d m
      JOIN model_3d.model_3d_file f ON f.id = m.file_id
      JOIN workspaces.workspace w ON w.id = m.workspace_id
      WHERE w.org_id = $1
        AND m.deleted_at IS NULL
    `, [orgId]);
    return Number(result[0].total);
  }

  async getSubscription(orgId: string): Promise<OrgSubscriptionEntity> {
    return this.dataSource.getRepository(OrgSubscriptionEntity)
      .findOneOrFail({ where: { org: { id: orgId } } });
  }

  async checkStorageQuota(orgId: string): Promise<void> {
    const sub = await this.getSubscription(orgId);
    if (sub.storageLimitBytes === null) return; // unlimited

    const used = await this.getStorageUsed(orgId);
    if (used >= sub.storageLimitBytes) {
      throw new AppHttpException(
        HttpStatus.PAYMENT_REQUIRED,
        'Storage quota exceeded. Upgrade your plan or delete existing models.',
      );
    }
  }

  async checkSeatsQuota(orgId: string): Promise<void> {
    const sub = await this.getSubscription(orgId);
    if (sub.seatsLimit === null) return; // unlimited

    const count = await this.dataSource.getRepository(OrgMemberEntity)
      .count({ where: { org: { id: orgId }, deletedAt: IsNull() } });

    if (count >= sub.seatsLimit) {
      throw new AppHttpException(
        HttpStatus.PAYMENT_REQUIRED,
        'Seat limit reached. Upgrade your plan to invite more members.',
      );
    }
  }
}
```

### Hardcoded plan limits (applied when creating `OrgSubscription`)

| Plan | `storageLimitBytes` | `seatsLimit` |
|---|---|---|
| `starter` | `50 * 1024^3` | `10` |
| `growth` | `null` (customer's S3) | `50` |
| `enterprise` | `null` | `null` |

Set these in `OrganizationService.createOrganization()` when creating the subscription entity.

**`storage-quota.module.ts`:**
```ts
@Module({
  providers: [StorageQuotaService],
  exports: [StorageQuotaService],
})
```

---

## 2. Hook into Upload Flow

**File:** `server/src/modules/models-3d/services/model-3d.service.ts`

Import `StorageQuotaService`, inject it, call in `upload3DModel()`:

```ts
// At the start of upload3DModel():
if (user's org context is available) {
  await this.storageQuotaService.checkStorageQuota(orgId);
}
```

**Problem:** The upload endpoint doesn't currently know which org the file belongs to.
Solution: add optional `workspaceId` to the upload body; derive `orgId` from workspace.

Update `POST /models-3d/upload` body to accept `workspaceId?: string`.
In service: if `workspaceId` provided, load workspace → get `orgId` → check quota.

---

## 3. Subscription Endpoint

**File:** `server/src/modules/organizations/controllers/organization.controller.ts`

Add:
```ts
@Get(':id/subscription')
@OrgMemberRole(OrgMemberRole.Viewer)
public async getSubscription(@Param('id', ParseUUIDPipe) id: string) {
  const sub = await this.storageQuotaService.getSubscription(id);
  const used = await this.storageQuotaService.getStorageUsed(id);
  return {
    planType: sub.org.planType,
    storageLimitBytes: sub.storageLimitBytes,
    seatsLimit: sub.seatsLimit,
    storageBackend: sub.storageBackend,
    storageUsedBytes: used,
  };
}
```

This is what the `QuotaBar` widget on the frontend (`OrgDashboard` in STEP-4) calls.

---

## 4. Module Registrations

- Import `StorageQuotaModule` in `OrganizationsModule`.
- Import `StorageQuotaModule` in `Models3dModule`.
- Both get `StorageQuotaService` via `exports`.

---

## Verification

1. Org on `starter` plan with 49 GB used → upload a 2 GB file → 402 Payment Required.
2. Org with `null` storageLimitBytes → upload succeeds regardless of size.
3. `GET /api/organizations/:id/subscription` returns `storageUsedBytes`.
4. Invite member when seats = limit → 402.
