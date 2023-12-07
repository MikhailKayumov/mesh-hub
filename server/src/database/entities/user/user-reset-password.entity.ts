import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { DatabaseSchemas, UserSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';

@Entity({ name: UserSchemaTables.UserResetPassword, schema: DatabaseSchemas.Users })
export class UserResetPasswordEntity extends GuidIdEntityBase {
  @OneToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;

  @Column({ type: 'timestamp with time zone', name: 'expired_at', nullable: false })
  public expiredAt: Date;
}
