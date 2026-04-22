import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, OrganizationsSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { OrgMemberRole } from './org-member.entity';
import { OrganizationEntity } from './organization.entity';

@Entity({ name: OrganizationsSchemaTables.OrgInvite, schema: DatabaseSchemas.Organizations })
export class OrgInviteEntity extends GuidIdEntityBase {
  @Column({ type: 'text', name: 'invited_email', nullable: false })
  public invitedEmail: string;

  @Column({
    type: 'enum',
    enum: OrgMemberRole,
    name: 'role',
    nullable: false,
  })
  public role: OrgMemberRole;

  @Column({ type: 'uuid', name: 'token', unique: true, nullable: false })
  public token: string;

  @Column({ type: 'timestamp with time zone', name: 'expires_at', nullable: false })
  public expiresAt: Date;

  @Column({ type: 'timestamp with time zone', name: 'accepted_at', nullable: true })
  public acceptedAt: Date | null;

  @Column({ type: 'uuid', name: 'org_id', nullable: false })
  public orgId: string;

  @ManyToOne(() => OrganizationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  public organization: OrganizationEntity;
}
