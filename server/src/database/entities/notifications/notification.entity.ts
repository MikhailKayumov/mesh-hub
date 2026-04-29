import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, NotificationsSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';

export const NotificationTypes = {
  CommentAdded: 'comment_added',
  InviteAccepted: 'invite_accepted',
  ModelUploaded: 'model_uploaded',
  ModelVersionProcessed: 'model_version_processed',
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes] | (string & {});

export type NotificationPayload = Record<string, unknown>;

@Index(['userId', 'isRead'])
@Entity({ name: NotificationsSchemaTables.Notification, schema: DatabaseSchemas.Notifications })
export class NotificationEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;

  @Column({ type: 'varchar', length: 50, name: 'type', nullable: false })
  public type: NotificationType;

  @Column({ type: 'jsonb', name: 'payload', nullable: false })
  public payload: NotificationPayload;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  public isRead: boolean;
}
