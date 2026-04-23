import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { Model3dEntity } from './model-3d.entity';

@Index(['modelId'])
@Entity({ name: Models3DSchemaTables.ModelAnnotation, schema: DatabaseSchemas.Models3D })
export class ModelAnnotationEntity extends GuidIdEntityBase {
  @Column({ type: 'varchar', length: 50, nullable: false })
  public label: string;

  @Column({ type: 'text', nullable: true })
  public body?: string;

  @Column({ type: 'float8', name: 'pos_x', nullable: false })
  public posX: number;

  @Column({ type: 'float8', name: 'pos_y', nullable: false })
  public posY: number;

  @Column({ type: 'float8', name: 'pos_z', nullable: false })
  public posZ: number;

  @Column({ type: 'float8', name: 'camera_pos_x', nullable: true })
  public cameraPosX?: number;

  @Column({ type: 'float8', name: 'camera_pos_y', nullable: true })
  public cameraPosY?: number;

  @Column({ type: 'float8', name: 'camera_pos_z', nullable: true })
  public cameraPosZ?: number;

  @Column({ type: 'int', name: 'order', default: 0 })
  public order: number;

  @Column({ type: 'uuid', name: 'model_id', nullable: false })
  public modelId: string;

  @ManyToOne(() => Model3dEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;
}
