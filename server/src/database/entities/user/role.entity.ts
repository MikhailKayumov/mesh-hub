import { Entity, Column } from 'typeorm';
import type { UserRole } from '@/constants';
import { DatabaseSchemas, UserSchemaTables } from '@/database/constants';
import { IntIdBaseEntity } from '@/database/entities/base';

@Entity({ name: UserSchemaTables.Role, schema: DatabaseSchemas.Users })
export class RoleEntity extends IntIdBaseEntity {
  @Column({ type: 'text', unique: true, nullable: false })
  public name: UserRole;

  @Column({ type: 'text', nullable: true })
  public description?: string;
}
