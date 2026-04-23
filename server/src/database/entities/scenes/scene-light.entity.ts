import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, ScenesSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { SceneEntity } from './scene.entity';

export enum LightType {
  Directional = 'directional',
  Point = 'point',
  Spot = 'spot',
}

@Entity({ name: ScenesSchemaTables.SceneLight, schema: DatabaseSchemas.Scenes })
export class SceneLightEntity extends GuidIdEntityBase {
  @Column({ type: 'enum', enum: LightType, name: 'type', nullable: false })
  public type: LightType;

  @Column({ type: 'float', name: 'pos_x', default: 0 })
  public posX: number;

  @Column({ type: 'float', name: 'pos_y', default: 0 })
  public posY: number;

  @Column({ type: 'float', name: 'pos_z', default: 0 })
  public posZ: number;

  @Column({ type: 'varchar', name: 'color', length: 7, default: '#ffffff' })
  public color: string;

  @Column({ type: 'float', name: 'intensity', default: 1.0 })
  public intensity: number;

  @Column({ type: 'boolean', name: 'cast_shadow', default: true })
  public castShadow: boolean;

  @Column({ type: 'uuid', name: 'scene_id', nullable: false })
  public sceneId: string;

  @ManyToOne(() => SceneEntity, (scene) => scene.lights, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scene_id' })
  public scene: SceneEntity;
}
