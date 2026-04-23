import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DatabaseSchemas, EmbedSchemaTables } from '@/database/constants';
import { IntIdBaseEntity } from '@/database/entities/base';
import { EmbedProjectEntity } from './embed-project.entity';

@Entity({ name: EmbedSchemaTables.EmbedDomainWhitelist, schema: DatabaseSchemas.Embed })
export class EmbedDomainWhitelistEntity extends IntIdBaseEntity {
  @Column({ type: 'text', name: 'domain', nullable: false })
  public domain: string;

  @Index()
  @Column({ type: 'uuid', name: 'embed_project_id', nullable: false })
  public embedProjectId: string;

  @ManyToOne(() => EmbedProjectEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'embed_project_id' })
  public embedProject: EmbedProjectEntity;
}
