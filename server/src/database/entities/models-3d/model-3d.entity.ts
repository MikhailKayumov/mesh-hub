import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne } from 'typeorm';
import { ModelVisibility } from '@/constants';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { Model3dFileEntity } from '@/database/entities/models-3d/model-3d-file.entity';
import { CategoryEntity } from '@/database/entities/resources/category.entity';
import { UserEntity } from '@/database/entities/user/user.entity';

@Entity({ name: Models3DSchemaTables.Model3D, schema: DatabaseSchemas.Models3D })
export class Model3dEntity extends GuidIdEntityBase {
  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;

  @Column({ type: 'text', nullable: false })
  public name: string;

  @OneToOne(() => Model3dFileEntity, { nullable: false, cascade: true, eager: true })
  @JoinColumn({ name: 'file_id' })
  public file: Model3dFileEntity;

  @Column({ type: 'json', nullable: true })
  public description?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  public thumbnail?: string;

  @Column({ type: 'enum', enum: ModelVisibility, enumName: 'model_visibility', default: ModelVisibility.Public })
  public visibility: ModelVisibility;

  @ManyToMany(() => CategoryEntity, { nullable: true })
  @JoinTable({
    name: Models3DSchemaTables.Model3DCategories,
    schema: DatabaseSchemas.Models3D,
    joinColumn: { name: 'model_3d_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  public categories?: CategoryEntity[];
}
