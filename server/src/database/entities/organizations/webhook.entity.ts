import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, OrganizationsSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { OrganizationEntity } from './organization.entity';

@Index(['orgId'])
@Entity({ name: OrganizationsSchemaTables.Webhook, schema: DatabaseSchemas.Organizations })
export class WebhookEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'org_id', nullable: false })
  public orgId: string;

  @ManyToOne(() => OrganizationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  public organization: OrganizationEntity;

  @Column({ type: 'text', name: 'url', nullable: false })
  public url: string;

  @Column({ type: 'text', name: 'events', array: true, nullable: false })
  public events: string[];

  @Column({ type: 'varchar', length: 255, name: 'secret', nullable: false })
  public secret: string;

  @Column({ type: 'boolean', name: 'is_active', nullable: false, default: true })
  public isActive: boolean;
}
