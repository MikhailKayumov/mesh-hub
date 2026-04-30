import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DatabaseSchemas, ScenesSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { SceneConfig } from './scene-config.type';
import { SceneLightEntity } from './scene-light.entity';
import { SceneObjectEntity } from './scene-object.entity';

export type SceneVisibility = 'public' | 'private' | 'unlisted';

@Entity({ name: ScenesSchemaTables.Scene, schema: DatabaseSchemas.Scenes })
@Check('CHK_scene_owner', '"user_id" IS NOT NULL OR "workspace_id" IS NOT NULL')
@Index(['workspaceId'])
@Index(['userId'])
export class SceneEntity extends GuidIdEntityBase {
  @Column({ type: 'varchar', name: 'name', length: 100, nullable: false })
  public name: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  public description: string | null;

  @Column({ type: 'jsonb', name: 'config', nullable: true })
  public config: SceneConfig | null;

  @Column({ type: 'text', name: 'thumbnail_path', nullable: true })
  public thumbnailPath: string | null;

  @Column({ type: 'uuid', name: 'workspace_id', nullable: true })
  public workspaceId: string | null;

  @ManyToOne(() => WorkspaceEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  public workspace: WorkspaceEntity | null;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  public userId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity | null;

  @Column({
    type: 'enum',
    enum: ['public', 'private', 'unlisted'],
    name: 'visibility',
    default: 'private',
  })
  public visibility: SceneVisibility;

  @OneToMany(() => SceneObjectEntity, (obj) => obj.scene)
  public objects: SceneObjectEntity[];

  @OneToMany(() => SceneLightEntity, (light) => light.scene)
  public lights: SceneLightEntity[];
}
