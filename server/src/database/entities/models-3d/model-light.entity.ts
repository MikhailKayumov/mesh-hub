import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { Model3dEntity } from './model-3d.entity';

@Index(['modelId'])
@Entity({ name: Models3DSchemaTables.ModelLight, schema: DatabaseSchemas.Models3D })
export class ModelLightEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'model_id', nullable: false })
  public modelId: string;

  @ManyToOne(() => Model3dEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;

  @Column({ type: 'varchar', name: 'type', length: 15, nullable: false })
  public type: string;

  @Column({ type: 'float8', name: 'pos_x', nullable: false, default: 0 })
  public posX: number;

  @Column({ type: 'float8', name: 'pos_y', nullable: false, default: 5 })
  public posY: number;

  @Column({ type: 'float8', name: 'pos_z', nullable: false, default: 5 })
  public posZ: number;

  @Column({ type: 'varchar', name: 'color', length: 9, nullable: false, default: '#ffffff' })
  public color: string;

  @Column({ type: 'float8', name: 'intensity', nullable: false, default: 1.0 })
  public intensity: number;

  @Column({ type: 'boolean', name: 'cast_shadow', nullable: false, default: true })
  public castShadow: boolean;
}
