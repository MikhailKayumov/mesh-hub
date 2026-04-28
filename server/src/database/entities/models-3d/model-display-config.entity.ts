import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { Model3dEntity } from './model-3d.entity';

@Entity({ name: Models3DSchemaTables.ModelDisplayConfig, schema: DatabaseSchemas.Models3D })
export class ModelDisplayConfigEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'model_id', nullable: false, unique: true })
  public modelId: string;

  @OneToOne(() => Model3dEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;

  @Column({ type: 'varchar', name: 'background_color', length: 9, nullable: false, default: '#000000' })
  public backgroundColor: string;

  @Column({ type: 'float8', name: 'ambient_intensity', nullable: false, default: 0.5 })
  public ambientIntensity: number;

  @Column({ type: 'text', name: 'environment_hdri_path', nullable: true })
  public environmentHdriPath?: string;

  @Column({ type: 'boolean', name: 'fog_enabled', nullable: false, default: false })
  public fogEnabled: boolean;

  @Column({ type: 'varchar', name: 'fog_type', length: 10, nullable: false, default: 'linear' })
  public fogType: string;

  @Column({ type: 'varchar', name: 'fog_color', length: 9, nullable: false, default: '#cccccc' })
  public fogColor: string;

  @Column({ type: 'float8', name: 'fog_near', nullable: false, default: 10 })
  public fogNear: number;

  @Column({ type: 'float8', name: 'fog_far', nullable: false, default: 100 })
  public fogFar: number;

  @Column({ type: 'jsonb', name: 'post_process', nullable: true })
  public postProcess?: Record<string, any>;

  @Column({ type: 'jsonb', name: 'renderer_config', nullable: true })
  public rendererConfig?: Record<string, any>;
}
