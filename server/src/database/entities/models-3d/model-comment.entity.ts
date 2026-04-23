import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';
import { Model3dEntity } from './model-3d.entity';

@Index(['modelId'])
@Entity({ name: Models3DSchemaTables.ModelComment, schema: DatabaseSchemas.Models3D })
export class ModelCommentEntity extends GuidIdEntityBase {
  @Column({ type: 'text', nullable: false })
  public body: string;

  @Column({ type: 'float8', name: 'pos_x', nullable: true })
  public posX?: number;

  @Column({ type: 'float8', name: 'pos_y', nullable: true })
  public posY?: number;

  @Column({ type: 'float8', name: 'pos_z', nullable: true })
  public posZ?: number;

  @Column({ type: 'boolean', name: 'resolved', default: false })
  public resolved: boolean;

  @Column({ type: 'uuid', name: 'model_id', nullable: false })
  public modelId: string;

  @Column({ type: 'uuid', name: 'author_id', nullable: false })
  public authorId: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  public parentId?: string;

  @ManyToOne(() => Model3dEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'author_id' })
  public author: UserEntity;

  @ManyToOne(() => ModelCommentEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  public parent?: ModelCommentEntity;
}
