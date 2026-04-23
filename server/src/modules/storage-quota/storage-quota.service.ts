import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { IsNull, DataSource } from 'typeorm';
import { OrgMemberEntity } from '@/database/entities/organizations/org-member.entity';
import { OrgSubscriptionEntity } from '@/database/entities/organizations/org-subscription.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { AppHttpException } from '@/exceptions/app-http.exception';

@Injectable()
export class StorageQuotaService {
  public constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public async getStorageUsed(orgId: string): Promise<number> {
    const result = await this.dataSource.query<{ total: string }[]>(
      `
      SELECT COALESCE(SUM(f.size), 0)::bigint AS total
      FROM model_3d.model_3d m
      JOIN model_3d.model_3d_file f ON f.id = m.file_id
      JOIN workspaces.workspace w ON w.id = m.workspace_id
      WHERE w.org_id = $1
        AND m.deleted_at IS NULL
      `,
      [orgId],
    );
    return Number(result[0].total);
  }

  public async getSubscription(orgId: string): Promise<OrgSubscriptionEntity> {
    return this.dataSource.getRepository(OrgSubscriptionEntity).findOneOrFail({ where: { orgId } });
  }

  public async checkStorageQuota(orgId: string): Promise<void> {
    const sub = await this.getSubscription(orgId);
    if (sub.storageLimitBytes === null) return;

    const used = await this.getStorageUsed(orgId);
    if (used >= Number(sub.storageLimitBytes)) {
      throw new AppHttpException(
        'Storage quota exceeded. Upgrade your plan or delete existing models.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  public async checkSeatsQuota(orgId: string): Promise<void> {
    const sub = await this.getSubscription(orgId);
    if (sub.seatsLimit === null) return;

    const count = await this.dataSource.getRepository(OrgMemberEntity).count({
      where: { orgId, deletedAt: IsNull() },
    });

    if (count >= sub.seatsLimit) {
      throw new AppHttpException(
        'Seat limit reached. Upgrade your plan to invite more members.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  public async checkStorageQuotaByWorkspace(workspaceId: string): Promise<void> {
    const workspace = await this.dataSource.getRepository(WorkspaceEntity).findOne({ where: { id: workspaceId } });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    await this.checkStorageQuota(workspace.orgId);
  }
}
