import { JoinColumn, OneToMany } from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { DatabaseSchemas } from '../../utils/constants';
import { BaseEntity } from '../base';
import { SessionEntity } from '../session/session.entity';

@Entity({ name: 'user', schema: DatabaseSchemas.User })
export class UserEntity extends BaseEntity {
  @Column({
    type: 'timestamp with time zone',
    name: 'last_login_date',
    nullable: true,
  })
  public lastLoginDate?: Date;

  @Column({ type: 'text', name: 'email', unique: true, nullable: false })
  public email: string;

  @Column({ type: 'text', name: 'password', nullable: false })
  public password: string;

  @Column({ type: 'text', name: 'salt', nullable: false })
  public salt: string;

  @Column({ type: 'text', name: 'nickname', nullable: true })
  public nickname?: string;

  @Column({ type: 'text', name: 'first_name', nullable: true })
  public firstName?: string;

  @Column({ type: 'text', name: 'middle_name', nullable: true })
  public middleName?: string;

  @Column({ type: 'text', name: 'last_name', nullable: true })
  public lastName?: string;

  @OneToMany(() => SessionEntity, (session) => session.user)
  @JoinColumn()
  public sessions: SessionEntity[];

  // @Column({ type: 'boolean', name: 'is_confirmed', default: false })
  // public isConfirmed: boolean;

  // @Column({ type: 'boolean', name: 'is_active', default: true })
  // public isActive: boolean;

  // @Column({ type: 'smallint', nullable: false, default: 1, unsigned: true })
  // public role: number;
}
