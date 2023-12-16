import { JoinTable, ManyToMany, Column, Entity } from 'typeorm';
import { DatabaseSchemas, UserSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { CgSoftEntity } from '@/database/entities/resources/cg-soft.entity';

@Entity({ name: UserSchemaTables.UserMeta, schema: DatabaseSchemas.Users })
export class UserMetaEntity extends GuidIdEntityBase {
  @Column({ type: 'text', name: 'about_yourself', nullable: true })
  public aboutYourself?: string;

  @Column({ type: 'text', name: 'avatar', nullable: true })
  public avatar?: string;

  @ManyToMany(() => CgSoftEntity, { nullable: true })
  @JoinTable({
    name: UserSchemaTables.UserMetaCgSoft,
    schema: DatabaseSchemas.Users,
    joinColumn: { name: 'user_meta_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'cg_soft_id', referencedColumnName: 'id' },
  })
  public favoriteSoft?: CgSoftEntity[];
}
