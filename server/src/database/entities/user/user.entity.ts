import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne } from 'typeorm';
import { DatabaseSchemas, UserSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { RoleEntity } from '@/database/entities/user/role.entity';
import { UserMetaEntity } from '@/database/entities/user/user-meta.entity';

@Entity({ name: UserSchemaTables.User, schema: DatabaseSchemas.Users })
export class UserEntity extends GuidIdEntityBase {
  @Column({ type: 'timestamp with time zone', name: 'last_login_date', nullable: true })
  public lastLoginDate?: Date;

  @Column({ type: 'text', name: 'email', unique: true, nullable: false })
  public email: string;

  @Column({ type: 'text', name: 'phone', unique: true, nullable: true })
  public phone?: string;

  @Column({ type: 'text', name: 'password', nullable: false })
  public password: string;

  @Column({ type: 'text', name: 'salt', nullable: false })
  public salt: string;

  @Column({ type: 'text', name: 'first_name', nullable: true })
  public firstName?: string;

  @Column({ type: 'text', name: 'middle_name', nullable: true })
  public middleName?: string;

  @Column({ type: 'text', name: 'last_name', nullable: true })
  public lastName?: string;

  @Column({ type: 'boolean', name: 'is_confirmed', default: false })
  public isConfirmed: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  public isActive: boolean;

  @OneToMany(() => SessionEntity, (session) => session.user)
  public sessions: SessionEntity[];

  @OneToOne(() => UserMetaEntity, { nullable: false, cascade: true })
  @JoinColumn({ name: 'user_meta_id' })
  public userMeta: UserMetaEntity;

  @ManyToMany(() => RoleEntity)
  @JoinTable({
    name: UserSchemaTables.UserRole,
    schema: DatabaseSchemas.Users,
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  public roles: RoleEntity[];
}
