import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, OrganizationsSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { WebhookEntity } from './webhook.entity';

@Index(['webhookId'])
@Entity({ name: OrganizationsSchemaTables.WebhookDeliveryLog, schema: DatabaseSchemas.Organizations })
export class WebhookDeliveryLogEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'webhook_id', nullable: false })
  public webhookId: string;

  @ManyToOne(() => WebhookEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhook_id' })
  public webhook: WebhookEntity;

  @Column({ type: 'varchar', length: 50, name: 'event', nullable: false })
  public event: string;

  @Column({ type: 'jsonb', name: 'payload', nullable: false })
  public payload: Record<string, unknown>;

  @Column({ type: 'int', name: 'response_status', nullable: true })
  public responseStatus: number | null;

  @Column({ type: 'timestamp with time zone', name: 'delivered_at', nullable: true })
  public deliveredAt: Date | null;

  @Column({ type: 'timestamp with time zone', name: 'failed_at', nullable: true })
  public failedAt: Date | null;
}
