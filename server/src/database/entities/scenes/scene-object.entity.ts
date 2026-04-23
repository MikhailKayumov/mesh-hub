import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, ScenesSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { SceneEntity } from './scene.entity';

@Entity({ name: ScenesSchemaTables.SceneObject, schema: DatabaseSchemas.Scenes })
@Index(['sceneId'])
export class SceneObjectEntity extends GuidIdEntityBase {
  @Column({ type: 'float', name: 'pos_x', default: 0 })
  public posX: number;

  @Column({ type: 'float', name: 'pos_y', default: 0 })
  public posY: number;

  @Column({ type: 'float', name: 'pos_z', default: 0 })
  public posZ: number;

  @Column({ type: 'float', name: 'rot_x', default: 0 })
  public rotX: number;

  @Column({ type: 'float', name: 'rot_y', default: 0 })
  public rotY: number;

  @Column({ type: 'float', name: 'rot_z', default: 0 })
  public rotZ: number;

  @Column({ type: 'float', name: 'scale_x', default: 1 })
  public scaleX: number;

  @Column({ type: 'float', name: 'scale_y', default: 1 })
  public scaleY: number;

  @Column({ type: 'float', name: 'scale_z', default: 1 })
  public scaleZ: number;

  @Column({ type: 'int', name: 'order', default: 0 })
  public order: number;

  @Column({ type: 'uuid', name: 'scene_id', nullable: false })
  public sceneId: string;

  @ManyToOne(() => SceneEntity, (scene) => scene.objects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scene_id' })
  public scene: SceneEntity;

  @Column({ type: 'uuid', name: 'model_id', nullable: false })
  public modelId: string;

  @ManyToOne(() => Model3dEntity, { nullable: false })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity;
}
