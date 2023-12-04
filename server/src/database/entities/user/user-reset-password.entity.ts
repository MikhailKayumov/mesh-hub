import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { DatabaseSchemas } from '../../utils/constants';
import { BaseEntity } from '../base';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'user_reset_password', schema: DatabaseSchemas.User })
export class UserResetPasswordEntity extends BaseEntity {
  @OneToOne(() => UserEntity, { nullable: false })
  @JoinColumn()
  public user: UserEntity;

  @Column({ type: 'timestamp with time zone', name: 'expired_at', nullable: false })
  public expiredAt: Date;
}
