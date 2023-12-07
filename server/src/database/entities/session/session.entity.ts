import { CreateDateColumn, JoinColumn, ManyToOne, Column, Entity } from 'typeorm';
import { AuthSchemaTables, DatabaseSchemas } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';

@Entity({ name: AuthSchemaTables.Session, schema: DatabaseSchemas.Auth })
export class SessionEntity extends GuidIdEntityBase {
  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: 'CASCADE' })
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
