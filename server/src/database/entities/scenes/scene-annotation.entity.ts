import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, ScenesSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';
import { SceneObjectEntity } from './scene-object.entity';
import { SceneEntity } from './scene.entity';

@Index(['sceneId'])
@Entity({ name: ScenesSchemaTables.SceneAnnotation, schema: DatabaseSchemas.Scenes })
export class SceneAnnotationEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'scene_id', nullable: false })
  public sceneId: string;

  @ManyToOne(() => SceneEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scene_id' })
  public scene: SceneEntity;

  @Column({ type: 'uuid', name: 'scene_object_id', nullable: true })
  public sceneObjectId: string | null;

  @ManyToOne(() => SceneObjectEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scene_object_id' })
  public sceneObject: SceneObjectEntity | null;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;

  @Column({ type: 'varchar', name: 'label', length: 120, nullable: false })
  public label: string;

  @Column({ type: 'text', name: 'body', nullable: true })
  public body: string | null;

  @Column({ type: 'double precision', name: 'pos_x', nullable: false })
  public posX: number;

  @Column({ type: 'double precision', name: 'pos_y', nullable: false })
  public posY: number;

  @Column({ type: 'double precision', name: 'pos_z', nullable: false })
  public posZ: number;

  @Column({ type: 'double precision', name: 'camera_pos_x', nullable: true })
  public cameraPosX: number | null;

  @Column({ type: 'double precision', name: 'camera_pos_y', nullable: true })
  public cameraPosY: number | null;

  @Column({ type: 'double precision', name: 'camera_pos_z', nullable: true })
  public cameraPosZ: number | null;

  @Column({ type: 'int', name: 'order', default: 0 })
  public order: number;
}
