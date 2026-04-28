import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, ScenesSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';
import { SceneEntity } from './scene.entity';

@Index(['sceneId'])
@Index(['parentId'])
@Entity({ name: ScenesSchemaTables.SceneComment, schema: DatabaseSchemas.Scenes })
export class SceneCommentEntity extends GuidIdEntityBase {
  @Column({ type: 'uuid', name: 'scene_id', nullable: false })
  public sceneId: string;

  @ManyToOne(() => SceneEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scene_id' })
  public scene: SceneEntity;

  @Column({ type: 'uuid', name: 'author_id', nullable: false })
  public authorId: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'author_id' })
  public author: UserEntity;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  public parentId: string | null;

  @ManyToOne(() => SceneCommentEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  public parent: SceneCommentEntity | null;

  @Column({ type: 'text', name: 'body', nullable: false })
  public body: string;

  @Column({ type: 'boolean', name: 'resolved', default: false })
  public resolved: boolean;
}
