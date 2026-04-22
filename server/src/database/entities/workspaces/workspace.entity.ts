import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, WorkspacesSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { OrganizationEntity } from '@/database/entities/organizations/organization.entity';

@Entity({ name: WorkspacesSchemaTables.Workspace, schema: DatabaseSchemas.Workspaces })
export class WorkspaceEntity extends GuidIdEntityBase {
  @Column({ type: 'text', name: 'name', nullable: false })
  public name: string;

  @Column({ type: 'uuid', name: 'org_id', nullable: false })
  public orgId: string;

  @ManyToOne(() => OrganizationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  public organization: OrganizationEntity;
}
