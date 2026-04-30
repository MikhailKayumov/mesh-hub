import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { DatabaseSchemas, WorkspacesSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceEntity } from './workspace.entity';

export enum WorkspaceMemberRole {
  Editor = 'editor',
  Viewer = 'viewer',
}

@Unique(['workspaceId', 'userId'])
@Index(['userId'])
@Entity({ name: WorkspacesSchemaTables.WorkspaceMember, schema: DatabaseSchemas.Workspaces })
export class WorkspaceMemberEntity extends GuidIdEntityBase {
  @Column({
    type: 'enum',
    enum: WorkspaceMemberRole,
    name: 'role',
    nullable: false,
  })
  public role: WorkspaceMemberRole;

  @Column({ type: 'uuid', name: 'workspace_id', nullable: false })
  public workspaceId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => WorkspaceEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  public workspace: WorkspaceEntity;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  public user: UserEntity;
}
