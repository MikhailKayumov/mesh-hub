import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DatabaseSchemas, ScenesSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { SceneConfig } from './scene-config.type';
import { SceneLightEntity } from './scene-light.entity';
import { SceneObjectEntity } from './scene-object.entity';

@Entity({ name: ScenesSchemaTables.Scene, schema: DatabaseSchemas.Scenes })
export class SceneEntity extends GuidIdEntityBase {
  @Column({ type: 'varchar', name: 'name', length: 100, nullable: false })
  public name: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  public description: string | null;

  @Column({ type: 'jsonb', name: 'config', nullable: true })
  public config: SceneConfig | null;

  @Column({ type: 'text', name: 'thumbnail_path', nullable: true })
  public thumbnailPath: string | null;

  @Column({ type: 'uuid', name: 'workspace_id', nullable: false })
  public workspaceId: string;

  @ManyToOne(() => WorkspaceEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  public workspace: WorkspaceEntity;

  @OneToMany(() => SceneObjectEntity, (obj) => obj.scene)
  public objects: SceneObjectEntity[];

  @OneToMany(() => SceneLightEntity, (light) => light.scene)
  public lights: SceneLightEntity[];
}
