import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, EmbedSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { OrganizationEntity } from '@/database/entities/organizations/organization.entity';

@Entity({ name: EmbedSchemaTables.ApiKey, schema: DatabaseSchemas.Embed })
export class ApiKeyEntity extends GuidIdEntityBase {
  @Column({ type: 'text', name: 'name', nullable: false })
  public name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 8, name: 'prefix', nullable: false })
  public prefix: string;

  @Index({ unique: true })
  @Column({ type: 'text', name: 'key_hash', nullable: false })
  public keyHash: string;

  @Column({ type: 'timestamp with time zone', name: 'last_used_at', nullable: true })
  public lastUsedAt: Date | null;

  @Column({ type: 'timestamp with time zone', name: 'expires_at', nullable: true })
  public expiresAt: Date | null;

  @Column({ type: 'timestamp with time zone', name: 'revoked_at', nullable: true })
  public revokedAt: Date | null;

  @Column({ type: 'text', name: 'scopes', array: true, nullable: false, default: ['embed:read'] })
  public scopes: string[];

  @Column({ type: 'uuid', name: 'org_id', nullable: false })
  public orgId: string;

  @ManyToOne(() => OrganizationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  public organization: OrganizationEntity;
}
