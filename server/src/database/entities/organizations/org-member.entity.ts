import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { DatabaseSchemas, OrganizationsSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';
import { OrganizationEntity } from './organization.entity';

export enum OrgMemberRole {
  Owner = 'owner',
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

/** Higher weight = more privileged. Used for hierarchical role checks. */
export const OrgMemberRoleWeights: Record<OrgMemberRole, number> = {
  [OrgMemberRole.Owner]: 3,
  [OrgMemberRole.Admin]: 2,
  [OrgMemberRole.Editor]: 1,
  [OrgMemberRole.Viewer]: 0,
};

@Unique(['orgId', 'userId'])
@Entity({ name: OrganizationsSchemaTables.OrgMember, schema: DatabaseSchemas.Organizations })
export class OrgMemberEntity extends GuidIdEntityBase {
  @Column({
    type: 'enum',
    enum: OrgMemberRole,
    name: 'role',
    nullable: false,
  })
  public role: OrgMemberRole;

  @Column({ type: 'uuid', name: 'org_id', nullable: false })
  public orgId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => OrganizationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  public organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;
}
