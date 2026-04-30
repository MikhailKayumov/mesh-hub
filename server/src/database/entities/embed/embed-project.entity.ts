import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DatabaseSchemas, EmbedSchemaTables } from '@/database/constants';
import { GuidIdEntityBase } from '@/database/entities/base';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { OrganizationEntity } from '@/database/entities/organizations/organization.entity';
import { SceneEntity } from '@/database/entities/scenes/scene.entity';
import { EmbedDomainWhitelistEntity } from './embed-domain-whitelist.entity';

export interface BrandingConfig {
  logoUrl?: string;
  primaryColor?: string;
  showBadge: boolean;
}

@Entity({ name: EmbedSchemaTables.EmbedProject, schema: DatabaseSchemas.Embed })
@Check('embed_project_target_check', 'num_nonnulls("model_id", "scene_id") = 1')
@Index(['orgId'])
@Index(['modelId'])
@Index(['sceneId'])
export class EmbedProjectEntity extends GuidIdEntityBase {
  @Column({ type: 'text', name: 'name', nullable: false })
  public name: string;

  @Column({ type: 'json', name: 'branding_config', nullable: true })
  public brandingConfig: BrandingConfig | null;

  @Column({ type: 'boolean', name: 'auto_rotate', nullable: false, default: false })
  public autoRotate: boolean;

  @Column({ type: 'uuid', name: 'org_id', nullable: false })
  public orgId: string;

  @ManyToOne(() => OrganizationEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  public organization: OrganizationEntity;

  @Column({ type: 'uuid', name: 'model_id', nullable: true })
  public modelId: string | null;

  @ManyToOne(() => Model3dEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'model_id' })
  public model: Model3dEntity | null;

  @Column({ type: 'uuid', name: 'scene_id', nullable: true })
  public sceneId: string | null;

  @ManyToOne(() => SceneEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scene_id' })
  public scene: SceneEntity | null;

  @OneToMany(() => EmbedDomainWhitelistEntity, (d) => d.embedProject, { cascade: false })
  public domains: EmbedDomainWhitelistEntity[];
}
