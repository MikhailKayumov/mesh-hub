import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, Models3DSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { Model3dEntity } from './model-3d.entity';

@Index(['modelId'])
@Entity({ name: Models3DSchemaTables.ModelMaterialOverride, schema: DatabaseSchemas.Models3D })
export class ModelMaterialOverrideEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'model_id', nullable: false })
  public modelId: string;

  @ManyToOne(() => Model3dEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;

  @Column({ type: 'varchar', name: 'mesh_name', length: 255, nullable: false })
  public meshName: string;

  @Column({ type: 'varchar', name: 'color_hex', length: 9, nullable: true })
  public colorHex?: string;

  @Column({ type: 'float8', name: 'metalness', nullable: true })
  public metalness?: number;

  @Column({ type: 'float8', name: 'roughness', nullable: true })
  public roughness?: number;

  @Column({ type: 'varchar', name: 'emissive_hex', length: 9, nullable: true })
  public emissiveHex?: string;

  @Column({ type: 'float8', name: 'emissive_intensity', nullable: true })
  public emissiveIntensity?: number;

  @Column({ type: 'float8', name: 'opacity', nullable: true })
  public opacity?: number;

  @Column({ type: 'boolean', name: 'wireframe', nullable: false, default: false })
  public wireframe: boolean;

  @Column({ type: 'text', name: 'texture_map_path', nullable: true })
  public textureMapPath?: string;

  @Column({ type: 'text', name: 'normal_map_path', nullable: true })
  public normalMapPath?: string;

  @Column({ type: 'text', name: 'roughness_map_path', nullable: true })
  public roughnessMapPath?: string;

  @Column({ type: 'text', name: 'metalness_map_path', nullable: true })
  public metalnessMapPath?: string;

  @Column({ type: 'text', name: 'emissive_map_path', nullable: true })
  public emissiveMapPath?: string;

  @Column({ type: 'text', name: 'ao_map_path', nullable: true })
  public aoMapPath?: string;
}
