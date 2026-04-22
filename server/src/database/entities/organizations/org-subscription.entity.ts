import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { DatabaseSchemas, OrganizationsSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { OrganizationEntity } from './organization.entity';

export enum StorageBackend {
  Local = 'local',
  S3 = 's3',
}

@Entity({ name: OrganizationsSchemaTables.OrgSubscription, schema: DatabaseSchemas.Organizations })
export class OrgSubscriptionEntity extends GuidIdEntityBase {
  @Column({ type: 'bigint', name: 'storage_limit_bytes', nullable: true })
  public storageLimitBytes: string | null;

  @Column({ type: 'integer', name: 'seats_limit', nullable: true })
  public seatsLimit: number | null;

  @Column({
    type: 'enum',
    enum: StorageBackend,
    name: 'storage_backend',
    nullable: false,
    default: StorageBackend.Local,
  })
  public storageBackend: StorageBackend;

  @Column({ type: 'text', name: 'storage_config_encrypted', nullable: true })
  public storageConfigEncrypted: string | null;

  @Column({ type: 'uuid', name: 'org_id', nullable: false, unique: true })
  public orgId: string;

  @OneToOne(() => OrganizationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  public organization: OrganizationEntity;
}
