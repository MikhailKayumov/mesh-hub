import { CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { DatabaseSchemas } from '../../utils/constants';
import { BaseEntity } from '../base';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'session', schema: DatabaseSchemas.Auth })
export class SessionEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;

  @Column({ type: 'text', name: 'access_token', nullable: false, unique: true })
  public accessToken: string;

  @Column({ type: 'text', name: 'refresh_token', nullable: false, unique: true })
  public refreshToken: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'expired_at',
    nullable: false,
  })
  public expiredAt: Date;

  @Column({ type: 'inet', nullable: false })
  public ip: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  public userAgent?: string;
}
